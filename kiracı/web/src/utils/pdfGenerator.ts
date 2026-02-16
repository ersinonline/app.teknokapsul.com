import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
    period: string;
    dueDate: Date;
    rentAmount: number;
    tenantTotal: number;
    landlordNet: number;
    status: string;
}

interface ContractData {
    tenant: {
        name: string;
        email: string;
        phone?: string;
    };
    property: {
        title: string;
        address: string;
    };
    rentAmount: number;
    startDate: Date;
    endDate: Date;
}

export const generateInvoicePDF = (invoice: InvoiceData, contract: ContractData) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(20, 184, 166); // Teal color
    doc.text('eKira', 20, 20);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Kira Faturası', 20, 35);

    // Invoice details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Dönem: ${invoice.period}`, 20, 45);
    doc.text(`Vade Tarihi: ${invoice.dueDate.toLocaleDateString('tr-TR')}`, 20, 52);
    doc.text(`Durum: ${getStatusLabel(invoice.status)}`, 20, 59);

    // Tenant info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Kiracı Bilgileri', 20, 75);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(contract.tenant.name, 20, 83);
    doc.text(contract.tenant.email, 20, 90);
    if (contract.tenant.phone) {
        doc.text(contract.tenant.phone, 20, 97);
    }

    // Property info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Mülk Bilgileri', 120, 75);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(contract.property.title, 120, 83);
    const addressLines = doc.splitTextToSize(contract.property.address, 70);
    doc.text(addressLines, 120, 90);

    // Payment details table
    autoTable(doc, {
        startY: 115,
        head: [['Açıklama', 'Tutar']],
        body: [
            ['Kira Bedeli', `${invoice.rentAmount.toLocaleString('tr-TR')} ₺`],
            ['Hizmet Bedeli (%5)', `${(invoice.tenantTotal - invoice.rentAmount).toLocaleString('tr-TR')} ₺`],
            ['Toplam Ödenecek', `${invoice.tenantTotal.toLocaleString('tr-TR')} ₺`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [20, 184, 166] },
        styles: { fontSize: 10 },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Bu belge eKira sistemi tarafından otomatik olarak oluşturulmuştur.', 20, pageHeight - 20);
    doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`, 20, pageHeight - 15);

    // Save
    doc.save(`fatura-${invoice.period}.pdf`);
};

export const generateMonthlyReportPDF = (
    month: string,
    invoices: InvoiceData[],
    totalRevenue: number,
    paidCount: number,
    pendingCount: number
) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(20, 184, 166);
    doc.text('eKira', 20, 20);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Aylık Gelir Raporu - ${month}`, 20, 35);

    // Summary
    doc.setFontSize(12);
    doc.text('Özet', 20, 50);

    autoTable(doc, {
        startY: 55,
        head: [['Metrik', 'Değer']],
        body: [
            ['Toplam Gelir', `${totalRevenue.toLocaleString('tr-TR')} ₺`],
            ['Ödenen Fatura', `${paidCount}`],
            ['Bekleyen Fatura', `${pendingCount}`],
            ['Toplam Fatura', `${invoices.length}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [20, 184, 166] },
    });

    // Invoices table
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(12);
    doc.text('Fatura Detayları', 20, finalY + 15);

    autoTable(doc, {
        startY: finalY + 20,
        head: [['Dönem', 'Tutar', 'Durum']],
        body: invoices.map(inv => [
            inv.period,
            `${inv.landlordNet.toLocaleString('tr-TR')} ₺`,
            getStatusLabel(inv.status),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [20, 184, 166] },
        styles: { fontSize: 9 },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Bu rapor eKira sistemi tarafından otomatik olarak oluşturulmuştur.', 20, pageHeight - 20);
    doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`, 20, pageHeight - 15);

    doc.save(`rapor-${month}.pdf`);
};

const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        PAID: 'Ödendi',
        DUE: 'Ödeme Bekliyor',
        OVERDUE: 'Gecikmiş',
        CLOSED_UPFRONT: 'Peşin Kapatıldı',
    };
    return labels[status] || status;
};
