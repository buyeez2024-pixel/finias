import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MANUAL_TESTING_DATA, TestingModule } from '../data/manualTestingData';
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
  if (viewType === 'table') height = 29;
  else if (viewType === 'dashboard') height = 29;
  else height = 31;

  // Outer container box with rounded corners
  doc.setFillColor(15, 23, 42); // slate-900
  doc.setDrawColor(51, 65, 85); // slate-700
  doc.setLineWidth(0.3);
  doc.roundedRect(x, startY, width, height, 2, 2, 'FD');

  // Top Chrome Bar
  doc.setFillColor(2, 6, 23); // slate-950
  doc.roundedRect(x, startY, width, 6.5, 2, 2, 'F');
  doc.rect(x, startY + 4, width, 2.5, 'F');

  // Traffic lights
  doc.setFillColor(239, 68, 68); doc.circle(x + 4, startY + 3.25, 1.1, 'F');
  doc.setFillColor(245, 158, 11); doc.circle(x + 7.5, startY + 3.25, 1.1, 'F');
  doc.setFillColor(16, 185, 129); doc.circle(x + 11, startY + 3.25, 1.1, 'F');

  // URL bar pill
  doc.setFillColor(30, 41, 59);
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

  // View type badge
  doc.setFillColor(16, 185, 129); // emerald-600 for QA context
  doc.roundedRect(x + width - 48, startY + 1.4, 45, 3.8, 1, 1, 'F');
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`● QA VERIFICATION | ${viewType.toUpperCase()} VIEW`, x + width - 25.5, startY + 4, { align: 'center' });

  // Toolbar
  const toolbarY = startY + 6.5;
  doc.setFillColor(30, 41, 59);
  doc.rect(x, toolbarY, width, 6.5, 'F');

  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(71, 85, 105);
  doc.roundedRect(x + 3, toolbarY + 1.3, 50, 4, 1, 1, 'FD');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text('🔍 Search SKU, records, invoice...', x + 5, toolbarY + 3.9);

  doc.setFillColor(12, 74, 110);
  doc.setDrawColor(56, 189, 248);
  doc.roundedRect(x + 56, toolbarY + 1.3, 72, 4, 1, 1, 'FD');
  doc.setTextColor(224, 242, 254);
  doc.text(dateBadge.substring(0, 42), x + 58, toolbarY + 3.9);

  doc.setFillColor(16, 185, 129);
  doc.roundedRect(x + width - 50, toolbarY + 1.3, 47, 4, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(actionText.substring(0, 22), x + width - 26.5, toolbarY + 3.9, { align: 'center' });

  return height;
}

// =========================================================================
// HELPER: RENDER VISUAL SCREENSHOT MOCKUP IN WORD (HTML FORMAT)
// =========================================================================
function renderMockupHtmlInWord(sub: DocSubmenu): string {
  const mockup = sub.mockup;
  const viewType = mockup?.viewType || 'table';
  const urlPath = mockup?.urlPath || `https://pos.royal-erp.internal/#/${sub.id}`;
  const dateBadge = mockup?.dateBadgeText || '📅 Date: Fiscal Calendar Active';
  const actionText = mockup?.primaryActionText || `+ Add Record`;

  return `
    <div style='background-color: #0f172a; border: 1.5pt solid #334155; border-radius: 8pt; margin: 12pt 0; overflow: hidden;'>
      <div style='background-color: #020617; padding: 6pt 10pt; border-bottom: 1pt solid #1e293b;'>
        <span style='color: #ef4444;'>●</span> <span style='color: #f59e0b;'>●</span> <span style='color: #10b981;'>●</span>
        <span style='margin-left: 10pt; color: #38bdf8; font-family: monospace; font-size: 8pt;'>https://${urlPath.replace('https://', '')}</span>
        <span style='float: right; background-color: #10b981; color: #fff; font-size: 7pt; font-weight: bold; padding: 2pt 6pt; border-radius: 4pt;'>● QA LIVE SCREENSHOT | ${viewType.toUpperCase()} VIEW</span>
      </div>
      <div style='background-color: #1e293b; padding: 6pt 10pt;'>
        <span style='color: #94a3b8; font-size: 8pt;'>🔍 Search...</span>
        <span style='margin-left: 10pt; color: #fff; background-color: #0369a1; padding: 2pt 8pt; border-radius: 4pt; font-size: 8pt;'>${dateBadge}</span>
        <span style='float: right; background-color: #10b981; color: #fff; font-size: 8pt; font-weight: bold; padding: 2pt 8pt; border-radius: 4pt;'>${actionText}</span>
      </div>
      <div style='padding: 20pt; text-align: center; color: #94a3b8; font-style: italic; font-size: 9pt;'>
        Visual Workspace Ready for QA Interaction & Functional Verification
      </div>
    </div>
  `;
}

// =========================================================================
// 1. PDF EXPORT WITH SCREENSHOTS & PAGINATION PROTECTION
// =========================================================================
export const exportTestingSuiteAsPdf = (modules: TestingModule[] = MANUAL_TESTING_DATA) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const safeBottomLimit = 274;

  let currentY = 16;

  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > safeBottomLimit) {
      doc.addPage();
      currentY = 18;
      return true;
    }
    return false;
  };

  // COVER PAGE
  doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, 75, 'F');
  doc.setFillColor(16, 185, 129); doc.rect(0, 75, pageWidth, 4, 'F');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.setTextColor(255, 255, 255);
  doc.text('ROYAL POS & ERP SYSTEM', margin, 32);
  doc.setFontSize(14); doc.setFont('helvetica', 'normal'); doc.setTextColor(167, 243, 208);
  doc.text('QA Manual Testing Master Suite: Positive & Negative Cases', margin, 42);
  doc.setFontSize(9); doc.setTextColor(148, 163, 184);
  doc.text('Official Functional Verification Protocol for All 14 Main Menus & Submenus', margin, 52);

  doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, 90, contentWidth, 45, 3, 3, 'FD');
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
  doc.text('QA TEST EXECUTION METADATA', margin + 6, 100);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105);
  doc.text(`• Test Suite Version: 2026.4.2 Complete Verification Edition (All 14 Menus)`, margin + 6, 108);
  doc.text(`• Generated On: ${new Date().toLocaleDateString()}`, margin + 6, 114);
  doc.text(`• Scope: Full Coverage Testing: Positive Paths, Negative Rejection, UX/UI Validation`, margin + 6, 120);
  doc.text(`• Standard: Black-Box Manual Verification with Screen Screenshot Context`, margin + 6, 126);

  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
  doc.text('TEST MODULES & EXECUTION SCOPE', margin, 150);

  let tocY = 160;
  modules.forEach((mod, idx) => {
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(16, 185, 129);
    doc.text(`${idx + 1}.`, margin + 2, tocY);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
    doc.text(`${mod.title} (${mod.testCases.length} Scenarios)`, margin + 10, tocY);
    tocY += 7.2;
  });

  doc.setFontSize(8); doc.setTextColor(148, 163, 184);
  doc.text('CONFIDENTIAL & PROPRIETARY • QA TEST EXECUTION REPORT', margin, pageHeight - 10);

  // DETAILED TEST PAGES
  modules.forEach((mod, modIdx) => {
    doc.addPage();
    currentY = 16;

    // Header
    doc.setFillColor(241, 245, 249); doc.rect(margin, currentY, contentWidth, 20, 'F');
    doc.setFillColor(16, 185, 129); doc.rect(margin, currentY, 3, 20, 'F');
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
    doc.text(`Module ${modIdx + 1}: ${mod.title}`, margin + 6, currentY + 10);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105);
    doc.text(`Category: ${mod.category} | Execution Plan`, margin + 6, currentY + 16);
    currentY += 26;

    // Overview
    ensureSpace(20);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text('Testing Objectives:', margin, currentY);
    currentY += 5;
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 65, 85);
    const splitOverview = doc.splitTextToSize(mod.overview, contentWidth);
    doc.text(splitOverview, margin, currentY);
    currentY += splitOverview.length * 4.5 + 4;

    mod.testCases.forEach((tc) => {
      ensureSpace(65);

      // find doc mockup for this test case
      const targetPath = tc.targetMenu.toLowerCase();
      const docMod = SYSTEM_DOCUMENTATION_DATA.find(d => 
        targetPath.includes(d.id.toLowerCase()) || 
        targetPath.includes(d.title.split('.')[1]?.trim().toLowerCase() || '')
      );
      const docSub = docMod?.submenus.find(s => 
        targetPath.includes(s.id.toLowerCase()) || 
        targetPath.includes(s.title.toLowerCase())
      ) || docMod?.submenus[0];

      // TC Header
      doc.setFillColor(248, 250, 252); doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD');
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
      doc.text(`[${tc.id}] ${tc.title}`, margin + 4, currentY + 6);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105);
      doc.text(`Menu: ${tc.targetMenu} | Feature: ${tc.feature}`, margin + 4, currentY + 11);
      currentY += 18;

      // Screen Screenshot
      if (docSub) {
        ensureSpace(38);
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
        doc.text('Visual Interface Context (Verification Screen):', margin, currentY);
        currentY += 4.5;
        const h = drawScreenMockupInPdf(doc, docSub, margin, currentY, contentWidth);
        currentY += h + 4;

        // Numbered Visual Callout Pins for QA
        if (docSub.screenshotPins && docSub.screenshotPins.length > 0) {
          ensureSpace(12);
          doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(16, 185, 129);
          doc.text('QA Pin-to-Pin Reference & Entry Points:', margin, currentY);
          currentY += 4;

          docSub.screenshotPins.forEach((pin) => {
            const labelText = `${pin.label} (${pin.fieldOrSection})`;
            const splitInst = doc.splitTextToSize(pin.instruction, contentWidth - 20);
            const pinNeeded = 4.5 + splitInst.length * 3.5 + 3;
            ensureSpace(pinNeeded);

            doc.setFillColor(16, 185, 129); // emerald-600
            doc.roundedRect(margin + 2, currentY, 15, 4.5, 1, 1, 'F');
            doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
            doc.text(`Pin ${pin.pinNumber}`, margin + 9.5, currentY + 3.2, { align: 'center' });

            doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
            doc.text(labelText, margin + 20, currentY + 3.2);
            currentY += 4.5;

            doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105);
            doc.text(splitInst, margin + 20, currentY + 2.2);
            currentY += splitInst.length * 3.5 + 2.5;
          });
          currentY += 2;
        }
      }

      // Logic
      ensureSpace(20);
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
      doc.text('What to Check & How to Perform:', margin, currentY);
      currentY += 4.5;
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 65, 85);
      const splitWhat = doc.splitTextToSize(tc.whatToCheck, contentWidth);
      doc.text(splitWhat, margin, currentY);
      currentY += splitWhat.length * 4 + 2;

      tc.howToCheck.forEach((step, sIdx) => {
        const splitStep = doc.splitTextToSize(`${sIdx + 1}. ${step.replace(/^\d+[\.\)]\s*/, '')}`, contentWidth - 4);
        ensureSpace(splitStep.length * 3.8 + 1);
        doc.text(splitStep, margin + 2, currentY);
        currentY += splitStep.length * 3.8 + 1;
      });
      currentY += 3;

      // Positive Table
      ensureSpace(25);
      autoTable(doc, {
        startY: currentY,
        head: [['Positive Test Path', 'Input Data', 'Expected Result']],
        body: [[tc.positiveTesting.steps.join('\n'), tc.positiveTesting.inputData, tc.positiveTesting.expectedResult]],
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], fontSize: 7.5 },
        bodyStyles: { fontSize: 7.2 },
        margin: { left: margin, right: margin }
      });
      currentY = (doc as any).lastAutoTable.finalY + 4;

      // Negative Table
      if (tc.negativeTesting.length > 0) {
        ensureSpace(25);
        autoTable(doc, {
          startY: currentY,
          head: [['Negative Scenario', 'Fault Input', 'Expected Rejection/Behavior']],
          body: tc.negativeTesting.map(n => [n.scenario, n.inputData, n.expectedErrorOrBehavior]),
          theme: 'grid',
          headStyles: { fillColor: [225, 29, 72], fontSize: 7.5 },
          bodyStyles: { fontSize: 7.2 },
          margin: { left: margin, right: margin }
        });
        currentY = (doc as any).lastAutoTable.finalY + 4;
      }

      ensureSpace(8);
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
      doc.text(`Final Pass Criteria: ${tc.passCriteria}`, margin, currentY);
      currentY += 10;
    });
  });

  // Footer / Page numbers
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5); doc.setTextColor(148, 163, 184);
    if (i > 1) {
      doc.text('ROYAL POS & ERP SYSTEM • QA MASTER TESTING SUITE', margin, 8);
      doc.line(margin, 10, pageWidth - margin, 10);
    }
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text('QA Test Plan • Confidential Reference', margin, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 7);
  }
  doc.save('Manual_Testing_Suite_Positive_Negative.pdf');
};

// =========================================================================
// 2. WORD EXPORT WITH SCREENSHOTS
// =========================================================================
export const exportTestingSuiteAsWord = (modules: TestingModule[] = MANUAL_TESTING_DATA) => {
  let html = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset='utf-8'><title>QA Manual Testing Suite</title>
    <style>
      body { font-family: 'Segoe UI', Arial; color: #1e293b; margin: 20pt; }
      h1 { color: #0f172a; border-bottom: 3pt solid #10b981; padding-bottom: 10pt; }
      h2 { color: #0f172a; background-color: #d1fae5; border-left: 5pt solid #10b981; padding: 8pt; page-break-before: always; }
      h3 { background-color: #f1f5f9; padding: 6pt; border-radius: 4pt; }
      table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 9.5pt; }
      th { background-color: #10b981; color: #fff; padding: 8pt; text-align: left; }
      td { padding: 6pt; border: 1pt solid #cbd5e1; vertical-align: top; }
      .neg-th { background-color: #e11d48; }
    </style>
  </head>
  <body>
    <h1>ROYAL POS & ERP SYSTEM</h1>
    <div style='color: #047857; font-size: 14pt; font-weight: bold;'>QA Manual Testing Master Suite: All 14 Main Menus</div>
    <div style='background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 12pt; margin: 20pt 0;'>
      <strong>Generated Date:</strong> ${new Date().toLocaleDateString()}<br>
      <strong>Coverage:</strong> 100% Functional Verification with Negative Edge Cases and Visual Screenshots.
    </div>
    <h2>Table of Contents</h2>
    <ul>${modules.map((m, i) => `<li>Module ${i + 1}: ${m.title}</li>`).join('')}</ul>
  `;

  modules.forEach((mod, idx) => {
    html += `<h2>Module ${idx + 1}: ${mod.title}</h2><p><strong>Overview:</strong> ${mod.overview}</p>`;
    mod.testCases.forEach(tc => {
      // Find mockup
      const targetPath = tc.targetMenu.toLowerCase();
      const docMod = SYSTEM_DOCUMENTATION_DATA.find(d => targetPath.includes(d.id.toLowerCase()) || targetPath.includes(d.title.split('.')[1]?.trim().toLowerCase() || ''));
      const docSub = docMod?.submenus.find(s => targetPath.includes(s.id.toLowerCase()) || targetPath.includes(s.title.toLowerCase())) || docMod?.submenus[0];

      html += `
        <h3>[${tc.id}] ${tc.title}</h3>
        <p><strong>Target:</strong> ${tc.targetMenu} | <strong>Feature:</strong> ${tc.feature}</p>
        <p><strong>Verification Steps:</strong></p><ol>${tc.howToCheck.map(s => `<li>${s.replace(/^\d+[\.\)]\s*/, '')}</li>`).join('')}</ol>
      `;

      if (docSub) {
        html += `
          <h4 style='color:#0f172a;'>🖥️ Verification Screen Screenshot & QA Pins:</h4>
          ${renderMockupHtmlInWord(docSub)}
          <div style='margin-top: 10pt;'>
            ${docSub.screenshotPins.map(pin => `
              <div style='margin-bottom: 8pt; border-bottom: 1pt solid #f1f5f9; padding-bottom: 4pt;'>
                <span style='background-color: #10b981; color: white; padding: 2pt 6pt; border-radius: 4pt; font-size: 8pt; font-weight: bold;'>Pin ${pin.pinNumber}</span>
                <strong style='font-size: 9pt; margin-left: 8pt;'>${pin.label} (${pin.fieldOrSection})</strong><br>
                <div style='margin-left: 36pt; font-size: 8.5pt; color: #475569;'>${pin.instruction}</div>
              </div>
            `).join('')}
          </div>
        `;
      }

      html += `
        <table><thead><tr><th>Positive Test Path</th><th>Input Data</th><th>Expected Result</th></tr></thead>
        <tbody><tr><td>${tc.positiveTesting.steps.join('<br>')}</td><td>${tc.positiveTesting.inputData}</td><td>${tc.positiveTesting.expectedResult}</td></tr></tbody></table>
      `;

      if (tc.negativeTesting.length > 0) {
        html += `
          <table><thead><tr><th class='neg-th'>Negative Scenario</th><th class='neg-th'>Fault Input</th><th class='neg-th'>Expected Behavior</th></tr></thead>
          <tbody>${tc.negativeTesting.map(n => `<tr><td>${n.scenario}</td><td>${n.inputData}</td><td>${n.expectedErrorOrBehavior}</td></tr>`).join('')}</tbody></table>
        `;
      }
      html += `<p><strong>Pass Criteria:</strong> ${tc.passCriteria}</p><hr>`;
    });
  });

  html += '</body></html>';
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'Manual_Testing_Suite_Positive_Negative.doc';
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};
