/**
 * Invoice Service
 * 
 * Generates PDF invoices with Arabic support using jsPDF.
 * Phase 10: SaaS Billing
 */

import { Invoice } from '../types/saas.types';

// We'll use dynamic import to avoid bundling jsPDF if not needed
let jsPDFModule: any = null;

async function getJsPDF() {
    if (!jsPDFModule) {
        const { default: jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
        jsPDFModule = jsPDF;
    }
    return jsPDFModule;
}

export interface InvoiceGeneratorOptions {
    organizationName: string;
    organizationNameAr: string;
    organizationAddress?: string;
    logoUrl?: string;
}

export async function generateInvoicePDF(
    invoice: Invoice, 
    options: InvoiceGeneratorOptions
): Promise<Blob> {
    const jsPDF = await getJsPDF();
    const doc = new jsPDF({ unit: 'pt', format: 'A4' });

    // Colors
    const primaryColor = [79, 70, 229]; // Indigo
    const textColor = [31, 41, 55];
    const lightGray = [156, 163, 175];

    // Header background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 595, 120, 'F');

    // Company name (white on purple)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(options.organizationNameAr || 'منصة التقارير التعليمية', 555, 50, { align: 'right' });
    
    doc.setFontSize(12);
    doc.text(options.organizationName || 'Educational Reports Platform', 555, 75, { align: 'right' });

    // Invoice title
    doc.setFontSize(14);
    doc.text(`فاتورة رقم: ${invoice.invoiceNumber}`, 555, 100, { align: 'right' });

    // Reset colors
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    // Invoice details section
    const detailsY = 150;
    doc.setFontSize(11);
    
    // Right side - Invoice info
    doc.setFont('helvetica', 'bold');
    doc.text('معلومات الفاتورة', 555, detailsY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(`التاريخ: ${new Date(invoice.createdAt).toLocaleDateString('ar-SA')}`, 555, detailsY + 20, { align: 'right' });
    doc.text(`تاريخ الاستحقاق: ${invoice.dueDate}`, 555, detailsY + 40, { align: 'right' });
    doc.text(`الحالة: ${getStatusArabic(invoice.status)}`, 555, detailsY + 60, { align: 'right' });

    // Left side - Period
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('فترة الفوترة', 40, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(`من: ${invoice.periodStart}`, 40, detailsY + 20);
    doc.text(`إلى: ${invoice.periodEnd}`, 40, detailsY + 40);

    // Divider
    doc.setDrawColor(229, 231, 235);
    doc.line(40, 230, 555, 230);

    // Items table
    const tableData = invoice.items.map(item => [
        item.total.toFixed(2),
        item.unitPrice.toFixed(2),
        item.quantity.toString(),
        item.description
    ]);

    (doc as any).autoTable({
        startY: 250,
        head: [['المجموع', 'السعر', 'الكمية', 'البند']],
        body: tableData,
        theme: 'plain',
        styles: {
            halign: 'right',
            fontSize: 10,
            cellPadding: 12
        },
        headStyles: {
            fillColor: [249, 250, 251],
            textColor: [107, 114, 128],
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [255, 255, 255]
        },
        margin: { left: 40, right: 40 }
    });

    // Totals section
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    
    // Subtotal
    doc.setFontSize(10);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('المجموع الفرعي:', 200, finalY, { align: 'right' });
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`${invoice.subtotal.toFixed(2)} ${invoice.currency}`, 120, finalY, { align: 'right' });

    // Tax
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(`ضريبة القيمة المضافة (${invoice.taxRate}%):`, 200, finalY + 20, { align: 'right' });
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`${invoice.tax.toFixed(2)} ${invoice.currency}`, 120, finalY + 20, { align: 'right' });

    // Divider
    doc.setDrawColor(229, 231, 235);
    doc.line(40, finalY + 35, 220, finalY + 35);

    // Total
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('الإجمالي:', 200, finalY + 55, { align: 'right' });
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${invoice.total.toFixed(2)} ${invoice.currency}`, 120, finalY + 55, { align: 'right' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('شكراً لثقتكم بنا', 297.5, 780, { align: 'center' });
    doc.text('للاستفسارات: support@yourplatform.com', 297.5, 795, { align: 'center' });

    // Notes if any
    if (invoice.notes) {
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(10);
        doc.text('ملاحظات:', 555, finalY + 90, { align: 'right' });
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.text(invoice.notes, 555, finalY + 110, { align: 'right', maxWidth: 500 });
    }

    return doc.output('blob');
}

function getStatusArabic(status: Invoice['status']): string {
    const statusMap: Record<Invoice['status'], string> = {
        draft: 'مسودة',
        sent: 'مرسلة',
        paid: 'مدفوعة',
        overdue: 'متأخرة',
        cancelled: 'ملغاة'
    };
    return statusMap[status];
}

export async function downloadInvoice(invoice: Invoice, options: InvoiceGeneratorOptions): Promise<void> {
    const blob = await generateInvoicePDF(invoice, options);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

export async function previewInvoice(invoice: Invoice, options: InvoiceGeneratorOptions): Promise<void> {
    const blob = await generateInvoicePDF(invoice, options);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}
