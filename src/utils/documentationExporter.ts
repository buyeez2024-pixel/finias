import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SYSTEM_DOCUMENTATION_DATA, DocModule } from '../data/systemDocumentationData';
import { DocSubmenu } from '../data/docs/types';

// =========================================================================
// HELPER: DRAW CRISP VISUAL SCREENSHOT MOCKUP IN PDF
// =========================================================================
function drawScreenMockupInPdf(
  doc: jsPDF,
  sub: DocSubmenu,
  x: number,
  startY: number,
  width: number
): number {
  const mockup = sub.mockup;
  const viewType = mockup?.viewType || 'table';
  const urlPath = mockup?.urlPath || `https://pos.royal-erp.internal/#/${sub.id}`;
  const dateBadge =
    mockup?.dateBadgeText ||
    (sub.whereToEnterDate ? '📅 Date: Fiscal Calendar Active' : '📅 Date: FY 2026-27');
  const actionText = mockup?.primaryActionText || `+ Add ${sub.title.split(' ')[0]}`;

  let height = 30;
  if (viewType === 'table') {
    height = 29;
  } else if (viewType === 'dashboard') {
    height = 29;
  } else {
    height = 31;
  }

  // Outer container box with rounded corners
  doc.setFillColor(15, 23, 42); // slate-900
  doc.setDrawColor(51, 65, 85); // slate-700
  doc.setLineWidth(0.3);
  doc.roundedRect(x, startY, width, height, 2, 2, 'FD');

  // Top Chrome Bar (height 6.5mm)
  doc.setFillColor(2, 6, 23); // slate-950
  doc.roundedRect(x, startY, width, 6.5, 2, 2, 'F');
  doc.rect(x, startY + 4, width, 2.5, 'F'); // square bottom corners of header

  // 3 Traffic lights
  doc.setFillColor(239, 68, 68); // Red
  doc.circle(x + 4, startY + 3.25, 1.1, 'F');
  doc.setFillColor(245, 158, 11); // Amber
  doc.circle(x + 7.5, startY + 3.25, 1.1, 'F');
  doc.setFillColor(16, 185, 129); // Green
  doc.circle(x + 11, startY + 3.25, 1.1, 'F');

  // URL bar pill
  doc.setFillColor(30, 41, 59); // slate-800
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(x + 15, startY + 1.4, 98, 3.8, 1, 1, 'FD');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('https://', x + 17, startY + 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 189, 248);
  const cleanUrl = urlPath.replace('https://', '').substring(0, 42);
  doc.text(cleanUrl, x + 25, startY + 4);

  // View type badge (right side)
  doc.setFillColor(2, 132, 199);
  doc.roundedRect(x + width - 48, startY + 1.4, 45, 3.8, 1, 1, 'F');
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(
    `● LIVE SCREENSHOT | ${viewType.toUpperCase()} VIEW`,
    x + width - 25.5,
    startY + 4,
    { align: 'center' }
  );

  // Toolbar Bar (height 6.5mm)
  const toolbarY = startY + 6.5;
  doc.setFillColor(30, 41, 59);
  doc.rect(x, toolbarY, width, 6.5, 'F');

  // Search input pill
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(71, 85, 105);
  doc.roundedRect(x + 3, toolbarY + 1.3, 50, 4, 1, 1, 'FD');
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('🔍 Search SKU, records, invoice...', x + 5, toolbarY + 3.9);

  // Date filter badge
  doc.setFillColor(12, 74, 110); // sky-900
  doc.setDrawColor(56, 189, 248);
  doc.roundedRect(x + 56, toolbarY + 1.3, 72, 4, 1, 1, 'FD');
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(224, 242, 254);
  const truncatedDateBadge =
    dateBadge.length > 44 ? dateBadge.substring(0, 42) + '...' : dateBadge;
  doc.text(truncatedDateBadge, x + 58, toolbarY + 3.9);

  // Primary action button
  doc.setFillColor(2, 132, 199);
  doc.roundedRect(x + width - 50, toolbarY + 1.3, 47, 4, 1, 1, 'F');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const truncatedAction =
    actionText.length > 24 ? actionText.substring(0, 22) + '...' : actionText;
  doc.text(truncatedAction, x + width - 26.5, toolbarY + 3.9, { align: 'center' });

  // Body Content (startY + 13mm)
  const bodyY = startY + 13;

  if (viewType === 'table' && mockup?.mockColumns && mockup.mockColumns.length > 0) {
    const cols = mockup.mockColumns.slice(0, 6);
    const colWidth = (width - 4) / cols.length;

    // Header row
    doc.setFillColor(51, 65, 85);
    doc.rect(x + 2, bodyY + 1, width - 4, 4.5, 'F');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(241, 245, 249);
    cols.forEach((col, cIdx) => {
      const colText = col.length > 15 ? col.substring(0, 13) + '..' : col;
      doc.text(colText, x + 3 + cIdx * colWidth, bodyY + 4);
    });

    // 2 sample rows
    const sampleRows = (mockup.mockRows || []).slice(0, 2);
    sampleRows.forEach((row, rIdx) => {
      const rowY = bodyY + 5.5 + rIdx * 4.5;
      doc.setFillColor(rIdx % 2 === 0 ? 15 : 30, rIdx % 2 === 0 ? 23 : 41, rIdx % 2 === 0 ? 42 : 59);
      doc.rect(x + 2, rowY, width - 4, 4.5, 'F');

      cols.forEach((col, cIdx) => {
        const val = String(row[col] || '-');
        const isStatus = col.toLowerCase().includes('status');
        const isDate = col.toLowerCase().includes('date') || col.toLowerCase().includes('time');

        if (isStatus) {
          const isGood =
            val.toLowerCase().includes('paid') ||
            val.toLowerCase().includes('received') ||
            val.toLowerCase().includes('active') ||
            val.toLowerCase().includes('approved');
          doc.setFillColor(isGood ? 6 : 120, isGood ? 95 : 53, isGood ? 70 : 15);
          doc.roundedRect(
            x + 3 + cIdx * colWidth,
            rowY + 0.8,
            Math.min(colWidth - 2, 22),
            3,
            0.8,
            0.8,
            'F'
          );
          doc.setFontSize(5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(isGood ? 52 : 252, isGood ? 211 : 211, isGood ? 153 : 77);
          doc.text(val.substring(0, 12), x + 4 + cIdx * colWidth, rowY + 2.9);
        } else {
          doc.setFontSize(5);
          doc.setFont('helvetica', isDate ? 'bold' : 'normal');
          doc.setTextColor(isDate ? 56 : 203, isDate ? 189 : 213, isDate ? 248 : 225);
          const cellText = val.length > 17 ? val.substring(0, 15) + '..' : val;
          doc.text(cellText, x + 3 + cIdx * colWidth, rowY + 2.9);
        }
      });
    });
  } else if (viewType === 'dashboard' && mockup?.statCards && mockup.statCards.length > 0) {
    const cards = mockup.statCards.slice(0, 4);
    const cardWidth = (width - 6 - (cards.length - 1) * 2) / cards.length;

    cards.forEach((card, cIdx) => {
      const cardX = x + 3 + cIdx * (cardWidth + 2);
      doc.setFillColor(30, 41, 59);
      doc.setDrawColor(71, 85, 105);
      doc.roundedRect(cardX, bodyY + 1.5, cardWidth, 12.5, 1.5, 1.5, 'FD');

      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(card.title.substring(0, 18), cardX + 2, bodyY + 4.5);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(card.value.substring(0, 14), cardX + 2, bodyY + 8.5);

      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(card.isPositive ? 52 : 251, card.isPositive ? 211 : 191, card.isPositive ? 153 : 36);
      doc.text(card.change.substring(0, 18), cardX + 2, bodyY + 12);
    });
  } else if (mockup?.formSections && mockup.formSections.length > 0) {
    const sec = mockup.formSections[0];
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(56, 189, 248);
    doc.text(sec.title.substring(0, 50), x + 4, bodyY + 3.5);

    const flds = sec.fields.slice(0, 3);
    const fldWidth = (width - 6 - (flds.length - 1) * 2) / flds.length;

    flds.forEach((fld, fIdx) => {
      const fldX = x + 3 + fIdx * (fldWidth + 2);
      doc.setFillColor(15, 23, 42);
      doc.setDrawColor(fld.isDate ? 56 : 71, fld.isDate ? 189 : 85, fld.isDate ? 248 : 105);
      doc.roundedRect(fldX, bodyY + 4.8, fldWidth, 8.5, 1, 1, 'FD');

      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(fld.isDate ? 56 : 148, fld.isDate ? 189 : 163, fld.isDate ? 248 : 184);
      const labelText = (fld.label + (fld.isRequired ? ' *' : '')).substring(0, 24);
      doc.text(labelText, fldX + 2, bodyY + 7.5);

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(226, 232, 240);
      const phText = fld.placeholder.substring(0, 26);
      doc.text(phText, fldX + 2, bodyY + 11.5);
    });
  } else {
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(x + 3, bodyY + 2, width - 6, 11, 1.5, 1.5, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(56, 189, 248);
    doc.text(`Active Workspace: ${sub.title}`, x + 6, bodyY + 6);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Ready for data operations under route: ${sub.menuPath}`, x + 6, bodyY + 10);
  }

  return height;
}

// =========================================================================
// 1. PDF EXPORT WITH BULLETPROOF PAGINATION & VISUAL SCREENSHOTS
// =========================================================================
export const exportDocumentationAsPdf = (
  modules: DocModule[] = SYSTEM_DOCUMENTATION_DATA
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const safeBottomLimit = 274; // Footer starts at 285, line at 285, text at 290

  let currentY = 16;

  // Pagination guard: guarantees no text or box ever touches the footer
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > safeBottomLimit) {
      doc.addPage();
      currentY = 18; // Clean margin below header
      return true;
    }
    return false;
  };

  // ==========================================
  // COVER PAGE
  // ==========================================
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 75, 'F');

  doc.setFillColor(2, 132, 199); // sky-600 accent bar
  doc.rect(0, 75, pageWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('ROYAL POS & ERP SYSTEM', margin, 32);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253); // sky-200
  doc.text('Comprehensive Operational & Field Reference Manual', margin, 42);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'Official End-to-End Enterprise Architecture, All 14 Menus, Submenus, Date Fields & Screen Specifications',
    margin,
    52
  );

  // Document Metadata Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, 90, contentWidth, 45, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('DOCUMENT SPECIFICATIONS', margin + 6, 100);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    `• Document Version: 2026.4 Complete Enterprise Edition (All 14 Menus)`,
    margin + 6,
    108
  );
  doc.text(
    `• Generated On: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    margin + 6,
    114
  );
  doc.text(
    `• Scope: In-depth pin-to-pin documentation: Why Used, How to Use, Where to Enter Date & Screenshots`,
    margin + 6,
    120
  );
  doc.text(
    `• Compliance: Multi-Branch GST / VAT / Tax Ready with Mandatory HSN & Real-Time RBAC`,
    margin + 6,
    126
  );

  // Table of Contents Overview
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TABLE OF CONTENTS (ALL 14 MAIN MENUS)', margin, 150);

  let tocY = 160;
  modules.forEach((mod, idx) => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199);
    doc.text(`${idx + 1}.`, margin + 2, tocY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(`${mod.title} (${mod.submenus.length} Submenus)`, margin + 10, tocY);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin + 90, tocY, pageWidth - margin - 15, tocY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(`Sec ${idx + 1}`, pageWidth - margin - 12, tocY);

    tocY += 7.2;
  });

  // Footer on cover
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'CONFIDENTIAL & PROPRIETARY • ROYAL ERP SYSTEM DOCUMENTATION',
    margin,
    pageHeight - 10
  );

  // ==========================================
  // DETAILED MODULE PAGES
  // ==========================================
  modules.forEach((mod, modIdx) => {
    doc.addPage();
    currentY = 16;

    // Module Header Banner
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, currentY, contentWidth, 20, 'F');
    doc.setFillColor(2, 132, 199); // sky-600 indicator
    doc.rect(margin, currentY, 3, 20, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Section ${modIdx + 1}: ${mod.title}`, margin + 6, currentY + 10);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Category: ${mod.category} | Submenus Covered: ${mod.submenus.length}`,
      margin + 6,
      currentY + 16
    );

    currentY += 26;

    // Overview
    ensureSpace(20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Module Overview & Purpose:', margin, currentY);
    currentY += 5;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitOverview = doc.splitTextToSize(mod.overview, contentWidth);
    doc.text(splitOverview, margin, currentY);
    currentY += splitOverview.length * 4.5 + 4;

    // Workflow Steps
    if (mod.workflowSteps && mod.workflowSteps.length > 0) {
      ensureSpace(25);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199);
      doc.text('Operational Workflow Steps:', margin, currentY);
      currentY += 5;

      mod.workflowSteps.forEach((ws) => {
        const splitDesc = doc.splitTextToSize(ws.description, contentWidth - 6);
        const wsNeeded = 4 + splitDesc.length * 4 + (ws.tips ? 5 : 2);
        ensureSpace(wsNeeded);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`Step ${ws.step}: ${ws.title}`, margin + 3, currentY);
        currentY += 4;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(splitDesc, margin + 6, currentY);
        currentY += splitDesc.length * 4 + 2;

        if (ws.tips) {
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(14, 116, 144);
          doc.text(`Tip: ${ws.tips}`, margin + 6, currentY);
          currentY += 4;
        }
      });
      currentY += 4;
    }

    // Submenus & Details
    mod.submenus.forEach((sub) => {
      // Ensure sufficient space for submenu start
      ensureSpace(60);

      // Submenu Header Banner
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD');

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${sub.title}`, margin + 4, currentY + 6);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Menu Path: ${sub.menuPath}`, margin + 4, currentY + 11);
      currentY += 18;

      // Why it is used
      ensureSpace(18);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Why It Is Used:', margin, currentY);
      currentY += 4;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const splitWhy = doc.splitTextToSize(sub.whyItIsUsed, contentWidth);
      doc.text(splitWhy, margin, currentY);
      currentY += splitWhy.length * 3.8 + 3;

      // How to use
      if (sub.howToUse && sub.howToUse.length > 0) {
        ensureSpace(16);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('How to Use (Step-by-Step):', margin, currentY);
        currentY += 4;

        sub.howToUse.forEach((step, sIdx) => {
          // Strip any duplicate leading numbers like "1. " from data
          const cleanStep = step.replace(/^\d+[\.\)]\s*/, '');
          const splitStep = doc.splitTextToSize(`${sIdx + 1}. ${cleanStep}`, contentWidth - 6);
          const stepHeight = splitStep.length * 3.8 + 1.2;

          ensureSpace(stepHeight);

          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(splitStep, margin + 3, currentY);
          currentY += stepHeight;
        });
        currentY += 2.5;
      }

      // Where to enter the date (Callout Box)
      if (sub.whereToEnterDate) {
        const cleanDateText = `WHERE TO ENTER THE DATE: ${sub.whereToEnterDate}`;
        const splitDateBox = doc.splitTextToSize(cleanDateText, contentWidth - 10);
        const boxHeight = splitDateBox.length * 3.8 + 6;

        ensureSpace(boxHeight + 4);

        // Soft sky-blue background box with clear border
        doc.setFillColor(240, 249, 255); // sky-50
        doc.setDrawColor(56, 189, 248); // sky-400
        doc.setLineWidth(0.4);
        doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'FD');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(3, 105, 161); // sky-700
        doc.text(splitDateBox, margin + 5, currentY + 4.8);
        currentY += boxHeight + 4;
      }

      // Screen Interface Visual Screenshot
      ensureSpace(38);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Screen Interface Visual Screenshot & Callout Pins:', margin, currentY);
      currentY += 4.5;

      // Draw the exact visual screen mockup
      const mockupDrawnHeight = drawScreenMockupInPdf(doc, sub, margin, currentY, contentWidth);
      currentY += mockupDrawnHeight + 4;

      // Numbered Visual Callout Pins
      if (sub.screenshotPins && sub.screenshotPins.length > 0) {
        ensureSpace(14);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(2, 132, 199);
        doc.text('Numbered Callout Pin Details & Operational Guidance:', margin, currentY);
        currentY += 4;

        sub.screenshotPins.forEach((pin) => {
          const labelText = `${pin.label} (${pin.fieldOrSection})`;
          const splitInst = doc.splitTextToSize(pin.instruction, contentWidth - 20);
          const dateText = pin.whereToEnterDate ? `📅 Date Entry: ${pin.whereToEnterDate}` : '';
          const splitDate = dateText ? doc.splitTextToSize(dateText, contentWidth - 20) : [];

          const pinNeededHeight =
            4.5 + splitInst.length * 3.5 + (splitDate.length > 0 ? splitDate.length * 3.5 + 2 : 0) + 3;
          ensureSpace(pinNeededHeight);

          // Numbered Badge Pill
          doc.setFillColor(2, 132, 199); // sky-600
          doc.roundedRect(margin + 2, currentY, 15, 4.5, 1, 1, 'F');
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text(`Pin ${pin.pinNumber}`, margin + 9.5, currentY + 3.2, { align: 'center' });

          // Target Label
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(labelText, margin + 20, currentY + 3.2);

          currentY += 4.5;

          // Wrapped Instruction
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(splitInst, margin + 20, currentY + 2.5);
          currentY += splitInst.length * 3.5 + 2.5;

          // Optional Date Guidance
          if (splitDate.length > 0) {
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(3, 105, 161);
            doc.text(splitDate, margin + 20, currentY);
            currentY += splitDate.length * 3.5 + 2;
          }

          // Subtle divider line
          doc.setDrawColor(241, 245, 249);
          doc.line(margin + 2, currentY, pageWidth - margin, currentY);
          currentY += 2;
        });
        currentY += 2;
      }

      // Field Reference Table
      if (sub.fields && sub.fields.length > 0) {
        ensureSpace(24);
        const tableBody = sub.fields.map((f) => [
          f.name + (f.required ? ' *' : ''),
          f.type,
          f.required ? 'Mandatory' : 'Optional',
          f.purpose + '\n\n' + f.functionality,
          f.validationRules,
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [
            ['Field Name', 'Type', 'Status', 'Purpose & Operational Functionality', 'Validation Rules'],
          ],
          body: tableBody,
          theme: 'grid',
          headStyles: {
            fillColor: [2, 132, 199], // sky-600
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: 'bold',
            halign: 'left',
          },
          bodyStyles: {
            fontSize: 7.5,
            textColor: [30, 41, 59],
            valign: 'top',
          },
          columnStyles: {
            0: { cellWidth: 32, fontStyle: 'bold' },
            1: { cellWidth: 24 },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 68 },
            4: { cellWidth: 40 },
          },
          margin: { top: 16, bottom: 20, left: margin, right: margin },
          styles: { overflow: 'linebreak', cellPadding: 2 },
          didDrawPage: (data) => {
            currentY = data.cursor?.y || currentY;
          },
        });

        const lastAutoTable = (doc as any).lastAutoTable;
        currentY = (lastAutoTable ? lastAutoTable.finalY : currentY) + 6;
        if (currentY > safeBottomLimit - 10) {
          doc.addPage();
          currentY = 18;
        }
      }
    });

    // Best Practices & Troubleshooting
    ensureSpace(35);
    if (mod.bestPractices && mod.bestPractices.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text('Recommended Operational Best Practices:', margin, currentY);
      currentY += 4.5;

      mod.bestPractices.forEach((bp) => {
        const splitBp = doc.splitTextToSize(`✓ ${bp}`, contentWidth - 4);
        ensureSpace(splitBp.length * 3.8 + 2);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(splitBp, margin + 2, currentY);
        currentY += splitBp.length * 3.8 + 1;
      });
      currentY += 3;
    }
  });

  // ==========================================
  // RUNNING HEADERS & FOOTERS (CLEAN & NON-OVERLAPPING)
  // ==========================================
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    if (i > 1) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        'ROYAL POS & ERP SYSTEM • OFFICIAL COMPLETE REFERENCE MANUAL',
        margin,
        8
      );
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 10, pageWidth - margin, 10);
    }

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.text(
      'Confidential • Internal Operational Reference',
      margin,
      pageHeight - 7
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin - 22,
      pageHeight - 7
    );
  }

  doc.save('ERP_System_Comprehensive_Documentation.pdf');
};

// =========================================================================
// HELPER: RENDER VISUAL SCREENSHOT MOCKUP IN WORD (HTML FORMAT)
// =========================================================================
function renderMockupHtmlInWord(sub: DocSubmenu): string {
  const mockup = sub.mockup;
  const viewType = mockup?.viewType || 'table';
  const urlPath = mockup?.urlPath || `https://pos.royal-erp.internal/#/${sub.id}`;
  const dateBadge =
    mockup?.dateBadgeText ||
    (sub.whereToEnterDate ? '📅 Date: Fiscal Calendar Active' : '📅 Date: FY 2026-27');
  const actionText = mockup?.primaryActionText || `+ Add ${sub.title.split(' ')[0]}`;

  let bodyHtml = '';

  if (viewType === 'table' && mockup?.mockColumns && mockup.mockColumns.length > 0) {
    const cols = mockup.mockColumns.slice(0, 6);
    const tableHead = cols.map((c) => `<th>${c}</th>`).join('');
    const tableRows = (mockup.mockRows || [])
      .slice(0, 3)
      .map((row) => {
        const cells = cols
          .map((col) => {
            const val = String(row[col] || '-');
            const isStatus = col.toLowerCase().includes('status');
            const isDate =
              col.toLowerCase().includes('date') || col.toLowerCase().includes('time');
            if (isStatus) {
              const isGood =
                val.toLowerCase().includes('paid') ||
                val.toLowerCase().includes('received') ||
                val.toLowerCase().includes('active') ||
                val.toLowerCase().includes('approved');
              return `<td><span class='${isGood ? 'badge-good' : 'badge-warn'}'>${val}</span></td>`;
            }
            if (isDate) {
              return `<td><strong style='color:#0284c7;'>📅 ${val}</strong></td>`;
            }
            return `<td>${val}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    bodyHtml = `
      <table class='mini-table'>
        <thead><tr>${tableHead}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;
  } else if (viewType === 'dashboard' && mockup?.statCards && mockup.statCards.length > 0) {
    const statCells = mockup.statCards
      .slice(0, 4)
      .map(
        (card) => `
      <td style='width: 25%; padding: 4pt; vertical-align: top;'>
        <div class='stat-card-cell'>
          <div class='stat-title'>${card.title}</div>
          <div class='stat-val'>${card.value}</div>
          <div class='stat-change' style='color:${card.isPositive ? '#10b981' : '#f59e0b'};'>${card.change}</div>
        </div>
      </td>
    `
      )
      .join('');

    bodyHtml = `
      <table style='width: 100%; border-collapse: collapse;'>
        <tr>${statCells}</tr>
      </table>
    `;
  } else if (mockup?.formSections && mockup.formSections.length > 0) {
    bodyHtml = mockup.formSections
      .slice(0, 2)
      .map((sec) => {
        const fldCells = sec.fields
          .slice(0, 3)
          .map(
            (fld) => `
          <td style='padding: 4pt; vertical-align: top;'>
            <div class='mockup-input-box' style='${
              fld.isDate ? 'border-color: #0284c7; background-color: #082f49;' : ''
            }'>
              <div class='mockup-input-label'>${fld.label}${
              fld.isRequired ? ' *' : ''
            }${
              fld.isDate
                ? ' <span style="background-color:#0284c7;color:#fff;font-size:6pt;padding:1pt 3pt;border-radius:2pt;">DATE INPUT</span>'
                : ''
            }</div>
              <div class='mockup-input-val'>${fld.placeholder}</div>
            </div>
          </td>
        `
          )
          .join('');

        return `
        <div class='mockup-form-section'>
          <div class='mockup-form-title'>${sec.title}</div>
          <table style='width: 100%; border-collapse: collapse;'>
            <tr>${fldCells}</tr>
          </table>
        </div>
      `;
      })
      .join('');
  } else {
    bodyHtml = `
      <div style='padding: 8pt; background-color: #1e293b; border-radius: 4pt; color: #cbd5e1;'>
        <strong style='color:#38bdf8;'>Workspace Live Status:</strong> Active operational console on route <code>${sub.menuPath}</code>
      </div>
    `;
  }

  return `
    <div class='mockup-container'>
      <div class='mockup-chrome'>
        <span class='traffic-dots'>
          <span class='dot dot-red'></span>
          <span class='dot dot-yellow'></span>
          <span class='dot dot-green'></span>
        </span>
        <span class='url-pill'>https://${urlPath.replace('https://', '')}</span>
        <span class='view-pill'>● LIVE SCREENSHOT | ${viewType.toUpperCase()} VIEW</span>
      </div>
      <div class='mockup-toolbar'>
        <span class='search-pill'>🔍 Search records, SKU, customer or invoice...</span>
        <span class='date-pill'>${dateBadge}</span>
        <span class='action-btn'>${actionText}</span>
      </div>
      <div class='mockup-body'>
        ${bodyHtml}
      </div>
    </div>
  `;
}

// =========================================================================
// 2. WORD DOCUMENT (.DOC) EXPORT WITH VISUAL SCREENSHOTS & CALLOUT TABLES
// =========================================================================
export const exportDocumentationAsWord = (
  modules: DocModule[] = SYSTEM_DOCUMENTATION_DATA
) => {
  let html = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset='utf-8'>
    <title>Royal ERP System - Complete Operational & Field Documentation</title>
    <style>
      body {
        font-family: 'Segoe UI', Calibri, Arial, sans-serif;
        color: #1e293b;
        line-height: 1.5;
        margin: 20px;
      }
      h1.cover-title {
        color: #0f172a;
        font-size: 28pt;
        font-weight: bold;
        margin-bottom: 4pt;
        border-bottom: 3pt solid #0284c7;
        padding-bottom: 12pt;
      }
      .subtitle {
        color: #0369a1;
        font-size: 14pt;
        font-weight: 600;
        margin-bottom: 16pt;
      }
      .meta-box {
        background-color: #f8fafc;
        border: 1pt solid #cbd5e1;
        padding: 12pt;
        margin-bottom: 24pt;
        border-radius: 6pt;
      }
      h2.module-title {
        color: #0f172a;
        font-size: 18pt;
        background-color: #e0f2fe;
        border-left: 5pt solid #0284c7;
        padding: 8pt 12pt;
        margin-top: 30pt;
        margin-bottom: 10pt;
        page-break-before: always;
      }
      h3.section-title {
        color: #0369a1;
        font-size: 13pt;
        border-bottom: 1.5pt solid #bae6fd;
        padding-bottom: 4pt;
        margin-top: 20pt;
      }
      .date-callout {
        background-color: #f0f9ff;
        border: 1.5pt solid #0284c7;
        border-left: 5pt solid #0284c7;
        padding: 10pt;
        margin: 12pt 0;
        border-radius: 4pt;
        font-weight: 500;
      }
      /* Screen Mockup Frame in Word */
      .mockup-container {
        background-color: #0f172a;
        border: 1.5pt solid #334155;
        border-radius: 8pt;
        margin: 12pt 0 16pt 0;
        overflow: hidden;
        font-family: 'Segoe UI', Calibri, sans-serif;
      }
      .mockup-chrome {
        background-color: #020617;
        padding: 6pt 10pt;
        border-bottom: 1pt solid #1e293b;
      }
      .traffic-dots {
        display: inline-block;
        vertical-align: middle;
      }
      .dot {
        display: inline-block;
        width: 8pt;
        height: 8pt;
        border-radius: 50%;
        margin-right: 3pt;
      }
      .dot-red { background-color: #ef4444; }
      .dot-yellow { background-color: #f59e0b; }
      .dot-green { background-color: #10b981; }
      .url-pill {
        display: inline-block;
        background-color: #1e293b;
        border: 1pt solid #334155;
        border-radius: 4pt;
        color: #38bdf8;
        font-size: 8pt;
        font-family: Consolas, monospace;
        padding: 2pt 8pt;
        margin-left: 8pt;
      }
      .view-pill {
        float: right;
        background-color: #0284c7;
        color: #ffffff;
        font-size: 7pt;
        font-weight: bold;
        padding: 2pt 6pt;
        border-radius: 4pt;
      }
      .mockup-toolbar {
        background-color: #1e293b;
        padding: 6pt 10pt;
        border-bottom: 1pt solid #334155;
      }
      .search-pill {
        display: inline-block;
        background-color: #0f172a;
        border: 1pt solid #475569;
        border-radius: 4pt;
        color: #94a3b8;
        font-size: 8pt;
        padding: 3pt 8pt;
      }
      .date-pill {
        display: inline-block;
        background-color: #0369a1;
        border: 1pt solid #38bdf8;
        border-radius: 4pt;
        color: #ffffff;
        font-size: 8pt;
        font-weight: bold;
        padding: 3pt 8pt;
        margin-left: 8pt;
      }
      .action-btn {
        float: right;
        background-color: #0284c7;
        color: #ffffff;
        font-size: 8pt;
        font-weight: bold;
        padding: 3pt 10pt;
        border-radius: 4pt;
      }
      .mockup-body {
        padding: 8pt;
        background-color: #0f172a;
      }
      .mini-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 8.5pt;
      }
      .mini-table th {
        background-color: #334155;
        color: #f1f5f9;
        padding: 4pt 6pt;
        text-align: left;
        border: 1pt solid #475569;
      }
      .mini-table td {
        padding: 4pt 6pt;
        border: 1pt solid #1e293b;
        color: #cbd5e1;
      }
      .badge-good {
        background-color: #065f46;
        color: #34d399;
        padding: 1pt 5pt;
        border-radius: 3pt;
        font-weight: bold;
        font-size: 7.5pt;
      }
      .badge-warn {
        background-color: #78350f;
        color: #fcd34d;
        padding: 1pt 5pt;
        border-radius: 3pt;
        font-weight: bold;
        font-size: 7.5pt;
      }
      .mockup-form-section {
        background-color: #1e293b;
        border: 1pt solid #334155;
        border-radius: 5pt;
        padding: 6pt;
        margin-bottom: 6pt;
      }
      .mockup-form-title {
        color: #38bdf8;
        font-size: 8.5pt;
        font-weight: bold;
        margin-bottom: 4pt;
      }
      .mockup-input-box {
        background-color: #0f172a;
        border: 1pt solid #475569;
        border-radius: 3pt;
        padding: 4pt 6pt;
      }
      .mockup-input-label {
        color: #94a3b8;
        font-size: 7pt;
        font-weight: bold;
      }
      .mockup-input-val {
        color: #f8fafc;
        font-size: 8pt;
      }
      .stat-card-cell {
        background-color: #1e293b;
        border: 1pt solid #334155;
        border-radius: 5pt;
        padding: 6pt 8pt;
      }
      .stat-title {
        color: #94a3b8;
        font-size: 7pt;
        text-transform: uppercase;
      }
      .stat-val {
        color: #ffffff;
        font-size: 11pt;
        font-weight: bold;
      }
      .stat-change {
        font-size: 7.5pt;
      }
      /* Structured Callout Pins Table */
      table.pins-table {
        width: 100%;
        border-collapse: collapse;
        margin: 10pt 0 16pt 0;
        font-size: 9pt;
      }
      table.pins-table th {
        background-color: #0f172a;
        color: #38bdf8;
        padding: 6pt 8pt;
        border: 1pt solid #334155;
        text-align: left;
      }
      table.pins-table td {
        padding: 6pt 8pt;
        border: 1pt solid #cbd5e1;
        vertical-align: top;
      }
      .pin-pill {
        display: inline-block;
        background-color: #0284c7;
        color: #ffffff;
        font-weight: bold;
        font-size: 8pt;
        padding: 2pt 6pt;
        border-radius: 3pt;
      }
      p.overview-text {
        font-size: 10.5pt;
        color: #334155;
        margin-bottom: 12pt;
      }
      ol.workflow-list {
        margin-left: 18pt;
        margin-bottom: 16pt;
      }
      ol.workflow-list li {
        margin-bottom: 6pt;
      }
      table.field-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10pt;
        margin-bottom: 20pt;
        font-size: 9.5pt;
      }
      table.field-table th {
        background-color: #0284c7;
        color: #ffffff;
        font-weight: bold;
        text-align: left;
        padding: 8pt;
        border: 1pt solid #0284c7;
      }
      table.field-table td {
        padding: 6pt 8pt;
        border: 1pt solid #cbd5e1;
        vertical-align: top;
      }
      table.field-table tr:nth-child(even) {
        background-color: #f8fafc;
      }
      .required-badge {
        color: #e11d48;
        font-weight: bold;
      }
      .optional-badge {
        color: #64748b;
      }
    </style>
  </head>
  <body>
    <h1 class='cover-title'>ROYAL POS & ERP SYSTEM</h1>
    <div class='subtitle'>Official Complete Operational Manual: All 14 Main Menus & Submenus</div>
    
    <div class='meta-box'>
      <strong>System Version:</strong> 2026.4 Complete Enterprise Edition<br>
      <strong>Generated Date:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>
      <strong>Compliance:</strong> Multi-Location GST / VAT / Tax Ready with Mandatory HSN & RBAC<br>
      <strong>Full Coverage:</strong> Why It Is Used, How to Use, Where to Enter Date, Live Screen Mockups, and Numbered Callout Pins.
    </div>

    <h2>Table of Contents (All 14 Menus)</h2>
    <ul>
  `;

  modules.forEach((mod, idx) => {
    html += `<li><strong>Section ${idx + 1}:</strong> ${mod.title} (${mod.submenus.length} Submenus)</li>`;
  });

  html += `</ul>`;

  modules.forEach((mod, idx) => {
    html += `
      <h2 class='module-title'>Section ${idx + 1}: ${mod.title}</h2>
      <p><strong>Category:</strong> ${mod.category}</p>
      <p class='overview-text'><strong>Overview:</strong> ${mod.overview}</p>
    `;

    // Submenus
    mod.submenus.forEach((sub) => {
      html += `
        <h3 class='section-title'>${sub.title} (Path: ${sub.menuPath})</h3>
        <p><strong>Why It Is Used:</strong> ${sub.whyItIsUsed}</p>
        
        <p><strong>How to Use (Step-by-Step):</strong></p>
        <ol class='workflow-list'>
      `;

      sub.howToUse.forEach((step) => {
        const cleanStep = step.replace(/^\d+[\.\)]\s*/, '');
        html += `<li>${cleanStep}</li>`;
      });

      html += `</ol>`;

      if (sub.whereToEnterDate) {
        html += `
          <div class='date-callout'>
            <strong>📅 WHERE TO ENTER THE DATE:</strong><br>
            ${sub.whereToEnterDate}
          </div>
        `;
      }

      // Live Visual Screenshot Mockup in Word
      html += `
        <h4 style='color: #0f172a; margin-top: 14pt; margin-bottom: 6pt;'>🖥️ Screen Interface Visual Screenshot Mockup:</h4>
        ${renderMockupHtmlInWord(sub)}
      `;

      // Callout Pins Table
      if (sub.screenshotPins && sub.screenshotPins.length > 0) {
        html += `
          <h4 style='color: #0f172a; margin-top: 12pt; margin-bottom: 6pt;'>📌 Numbered Callout Pin Details & Operational Guidance:</h4>
          <table class='pins-table'>
            <thead>
              <tr>
                <th style='width: 12%; text-align: center;'>Pin</th>
                <th style='width: 28%;'>Target UI Element</th>
                <th style='width: 60%;'>Operational Instruction & Date Guidance</th>
              </tr>
            </thead>
            <tbody>
        `;

        sub.screenshotPins.forEach((pin) => {
          html += `
            <tr>
              <td style='text-align: center; vertical-align: top;'>
                <span class='pin-pill'>Pin ${pin.pinNumber}</span>
              </td>
              <td style='vertical-align: top;'>
                <strong>${pin.label}</strong><br>
                <span style='color: #64748b; font-size: 8.5pt;'>Location: ${pin.fieldOrSection}</span>
              </td>
              <td style='vertical-align: top;'>
                ${pin.instruction}
                ${
                  pin.whereToEnterDate
                    ? `<div style='margin-top: 4pt; color: #0284c7; font-weight: bold;'>📅 Date Entry: ${pin.whereToEnterDate}</div>`
                    : ''
                }
              </td>
            </tr>
          `;
        });

        html += `</tbody></table>`;
      }

      // Field Reference Table
      if (sub.fields && sub.fields.length > 0) {
        html += `
          <h4 style='color: #0f172a; margin-top: 12pt; margin-bottom: 6pt;'>📋 Field Specification Dictionary:</h4>
          <table class='field-table'>
            <thead>
              <tr>
                <th style='width: 20%;'>Field Name</th>
                <th style='width: 15%;'>Data Type</th>
                <th style='width: 10%;'>Requirement</th>
                <th style='width: 35%;'>Purpose & Functionality</th>
                <th style='width: 20%;'>Validation Rules</th>
              </tr>
            </thead>
            <tbody>
        `;

        sub.fields.forEach((f) => {
          html += `
            <tr>
              <td><strong>${f.name}</strong></td>
              <td><code>${f.type}</code></td>
              <td>${
                f.required
                  ? '<span class="required-badge">Mandatory</span>'
                  : '<span class="optional-badge">Optional</span>'
              }</td>
              <td><strong>Purpose:</strong> ${f.purpose}<br><br><strong>Functionality:</strong> ${
            f.functionality
          }</td>
              <td>${f.validationRules}</td>
            </tr>
          `;
        });

        html += `</tbody></table>`;
      }
    });
  });

  html += `</body></html>`;

  const blob = new Blob(['\ufeff' + html], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ERP_System_Comprehensive_Documentation.doc';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
