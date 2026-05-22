/**
 * Helper untuk export data ke PDF dan Excel.
 * Menggunakan jsPDF + autoTable untuk PDF, dan xlsx untuk Excel.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ExportColumn {
  header: string;
  key: string;
}

/**
 * Export data ke PDF dengan header sekolah dan tabel.
 * @param title   Judul laporan
 * @param columns Kolom header
 * @param rows    Data baris
 * @param subtitle Subtitle opsional (misal: periode)
 */
export function exportToPDF(
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  subtitle?: string
) {
  const doc = new jsPDF({ orientation: "landscape" });

  // Header sekolah
  doc.setFontSize(16);
  doc.text("SMA Kartini Batam", 14, 15);
  doc.setFontSize(11);
  doc.text(title, 14, 23);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 29);
    doc.setTextColor(0);
  }

  // Tanggal cetak
  doc.setFontSize(8);
  doc.text(
    `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    14,
    subtitle ? 35 : 29
  );

  // Tabel
  const tableHeaders = columns.map((c) => c.header);
  const tableRows = rows.map((row) =>
    columns.map((col) => {
      const val = row[col.key];
      if (val === null || val === undefined) return "—";
      return String(val);
    })
  );

  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: subtitle ? 40 : 34,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      doc.internal.pageSize.getWidth() - 40,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}

/**
 * Export data ke file Excel (.xlsx).
 * @param title    Judul untuk nama file
 * @param columns  Kolom header
 * @param rows     Data baris
 * @param sheetName Nama sheet
 */
export function exportToExcel(
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  sheetName = "Laporan"
) {
  // Buat data array dengan header
  const headerRow = columns.map((c) => c.header);
  const dataRows = rows.map((row) =>
    columns.map((col) => {
      const val = row[col.key];
      if (val === null || val === undefined) return "";
      return val;
    })
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  // Auto-width kolom
  const colWidths = columns.map((col, i) => {
    const maxLen = Math.max(
      col.header.length,
      ...dataRows.map((r) => String(r[i] ?? "").length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${title.replace(/\s+/g, "_").toLowerCase()}.xlsx`);
}
