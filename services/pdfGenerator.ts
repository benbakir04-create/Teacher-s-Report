import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportData } from '../types';

// Helper to reverse text for minimal Arabic support in basic text fields
// Note: Complete Arabic support (ligatures) requires robust font handling.
// For MVP/Phase 5, we use a basic font or rely on table rendering which handles it better if configured.
// Ideally, we would load a base64 font like Cairo here.
// For now, we utilize autoTable's capabilities and try to keep headers simple.

export const generateTeacherReport = (reports: ReportData[], summary: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(18);
    doc.text('Teacher Performance Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });

    // Summary Section
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 35, pageWidth - 10, 35);

    doc.setFontSize(14);
    doc.text('Performance Summary', 14, 45);
    
    const summaryData = [
        ['Total Reports', summary.totalReports.toString()],
        ['Active Schools', summary.activeSchools.toString()],
        ['Completion Rate', `${summary.completionRate}%`],
        ['Adherence Rate', `${summary.adherenceRate}%`]
    ];

    autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 12 }
    });

    // Recent Reports Table
    doc.text('Recent Reports History', 14, (doc as any).lastAutoTable.finalY + 15);

    const tableData = reports.map(r => [
        r.general?.date || '-',
        r.general?.school || '-',
        r.general?.sectionId || '-',
        r.quranReport ? 'Yes' : 'No',
        r.firstClass?.subject || '-'
    ]);

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Date', 'School', 'Section', 'Quran', 'Subject']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 10 }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} of ${pageCount} - Teacher Report App`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`teacher-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateSchoolReport = (reports: ReportData[]) => {
    // Similar structure for School aggregating data
    // For now, reusing the structure
    generateTeacherReport(reports, { totalReports: reports.length, activeSchools: 1, completionRate: 100, adherenceRate: 100 });
};
