import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

interface ExportButtonsProps {
  headers: string[];
  keys: string[];
  data: any[];
  filename: string;
  title: string;
  isLight?: boolean;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  headers,
  keys,
  data,
  filename,
  title,
  isLight = false,
}) => {
  const getExportData = () => {
    if (!data || data.length === 0) return [];
    return data.map((item) => {
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        const key = keys[index];
        let val = item[key];
        // Handle nested keys like 'category.name'
        if (key && key.includes('.')) {
          const parts = key.split('.');
          val = item;
          for (const part of parts) {
            val = val ? val[part] : '';
          }
        }
        row[header] = val !== undefined && val !== null ? val : '';
      });
      return row;
    });
  };

  const exportToPDF = () => {
    if (!data || data.length === 0) return;
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      
      // Add Title
      doc.setFontSize(16);
      doc.setTextColor(17, 24, 39); // dark charcoal
      doc.text(title, 14, 15);
      
      // Add Timestamp
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 21);
      
      const tableRows = data.map((item) => {
        return keys.map((key) => {
          let val = item[key];
          if (key && key.includes('.')) {
            const parts = key.split('.');
            val = item;
            for (const part of parts) {
              val = val ? val[part] : '';
            }
          }
          return val !== undefined && val !== null ? String(val) : '';
        });
      });

      autoTable(doc, {
        head: [headers],
        body: tableRows,
        startY: 26,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] }, // indigo
      });

      doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF', error);
    }
  };

  const exportToExcel = () => {
    if (!data || data.length === 0) return;
    try {
      const exportData = getExportData();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error('Failed to export Excel', error);
    }
  };

  const exportToCSV = () => {
    if (!data || data.length === 0) return;
    try {
      const exportData = getExportData();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.csv`, { bookType: 'csv' });
    } catch (error) {
      console.error('Failed to export CSV', error);
    }
  };

  const isDisabled = !data || data.length === 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={exportToPDF}
        disabled={isDisabled}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isLight
            ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
            : 'bg-rose-950/30 border-rose-900/50 text-rose-300 hover:bg-rose-950/50'
        }`}
        title="Export Report to PDF"
      >
        <FileText className="w-3.5 h-3.5 text-rose-500" />
        <span>PDF</span>
      </button>

      <button
        onClick={exportToExcel}
        disabled={isDisabled}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isLight
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300 hover:bg-emerald-950/50'
        }`}
        title="Export Report to Excel"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
        <span>Excel</span>
      </button>

      <button
        onClick={exportToCSV}
        disabled={isDisabled}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isLight
            ? 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
            : 'bg-sky-950/30 border-sky-900/50 text-sky-300 hover:bg-sky-950/50'
        }`}
        title="Export Report to CSV"
      >
        <Download className="w-3.5 h-3.5 text-sky-500" />
        <span>CSV</span>
      </button>
    </div>
  );
};
