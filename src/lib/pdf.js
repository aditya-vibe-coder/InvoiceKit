import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { formatINR, amountInWords, getStateName } from './gst';

/**
 * Generate a GST-compliant invoice PDF
 * @param {Object} invoice - full invoice object from db.getInvoice()
 * @param {Object} settings - business settings from db.getSettings()
 * @returns {Promise<{ success: boolean, blob: Blob|null, error: string|null }>}
 */
export async function generateInvoicePDF(invoice, settings) {
  try {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const margin = 15;
    const width = 210 - (margin * 2);
    let currentY = margin;

    // Document Type Header
    const docType = invoice.documentType || 'invoice';
    let headerText = 'TAX INVOICE';
    if (docType === 'proforma') headerText = 'PROFORMA INVOICE';
    if (docType === 'credit_note') headerText = 'CREDIT NOTE';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(headerText, 105, currentY, { align: 'center' });
    
    if (docType === 'proforma') {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150);
      doc.text('NOT A TAX INVOICE — FOR REFERENCE ONLY', 105, currentY + 6, { align: 'center' });
      doc.setTextColor(0);
    }
    
    if (docType === 'credit_note') {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Against Invoice: ${invoice.referenceInvoiceNumber || 'N/A'}`, 105, currentY + 6, { align: 'center' });
    }

    currentY += 15;

    // Watermark for Proforma
    if (docType === 'proforma') {
      doc.setRotation(45);
      doc.setFontSize(60);
      doc.setTextColor(240);
      doc.text('PROFORMA', 40, 150);
      doc.setRotation(0);
      doc.setTextColor(0);
    }

    // 2. Supplier Details
    if (settings.logoBase64) {
      try {
        doc.addImage(settings.logoBase64, 'JPEG', margin, currentY, 30, 30);
      } catch (e) {
        console.warn('Logo embedding failed', e);
      }
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.businessName || 'Business Name', margin, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const supplierAddr = [
      settings.address,
      `GSTIN: ${settings.gstin || 'N/A'}`,
      `State: ${getStateName(settings.stateCode)} (${settings.stateCode})`
    ].filter(Boolean);
    
    doc.text(supplierAddr, margin, currentY + 10);

    // Bank details on the right
    if (settings.bankName) {
      doc.setFont('helvetica', 'bold');
      doc.text('Bank Details:', 210 - margin, currentY + 5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      const bankDetails = [
        settings.bankName,
        `A/c: ${settings.bankAccount}`,
        `IFSC: ${settings.bankIfsc}`
      ].filter(Boolean);
      doc.text(bankDetails, 210 - margin, currentY + 10, { align: 'right' });
    }

    currentY += 35;
    doc.line(margin, currentY, 210 - margin, currentY);
    currentY += 10;

    // 3. Recipient Details
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', margin, currentY);
    
    const recipientX = margin + 30;
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.client?.name || 'Client Name', recipientX, currentY);
    doc.setFont('helvetica', 'normal');
    
    const recipientAddr = [
      invoice.client?.address,
      `GSTIN: ${invoice.client?.gstin || 'Unregistered'}`,
      `State: ${getStateName(invoice.client?.stateCode)} (${invoice.client?.stateCode})`
    ].filter(Boolean);
    doc.text(recipientAddr, recipientX, currentY + 5);

    // Invoice Meta (Right side)
    doc.text('Invoice No:', 150, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoiceNumber, 170, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Date:', 150, currentY + 5);
    doc.setFont('helvetica', 'bold');
    const dateObj = new Date(invoice.invoiceDate);
    const formattedDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.text(formattedDate, 170, currentY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Place of Supply:', 150, currentY + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${getStateName(invoice.client?.stateCode)} (${invoice.client?.stateCode})`, 170, currentY + 10);

    if (invoice.irn) {
      doc.setFont('helvetica', 'normal');
      doc.text('IRN:', 150, currentY + 15);
      doc.setFont('helvetica', 'bold');
      doc.text(invoice.irn.substring(0, 15) + '...', 170, currentY + 15);
    }
    
    currentY += invoice.irn ? 20 : 25;


    // 4. Line Items Table
    const tableColumns = ['#', 'Description', 'HSN/SAC', 'Qty', 'Rate', 'Taxable', 'GST%', 'Amount'];
    const tableRows = (invoice.lineItems || []).map((item, idx) => [
      idx + 1,
      item.description,
      item.hsn || 'N/A',
      item.qty,
      formatINR(item.rate),
      formatINR(item.qty * item.rate),
      `${item.gstRate}%`,
      formatINR(item.total)
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [tableColumns],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        currentY = data.cursor.y;
      }
    });

    currentY += 5;

    // 5. Totals Table
    const totals = {
      subtotal: invoice.subtotal || 0,
      totalCGST: invoice.totalCGST || 0,
      totalSGST: invoice.totalSGST || 0,
      totalIGST: invoice.totalIGST || 0,
      grandTotal: invoice.total || 0
    };

    const totalsRows = [];
    totalsRows.push(['Subtotal', '', '', '', formatINR(totals.subtotal)]);
    
    if (totals.totalCGST > 0) totalsRows.push(['CGST', '', '', '', formatINR(totals.totalCGST)]);
    if (totals.totalSGST > 0) totalsRows.push(['SGST', '', '', '', formatINR(totals.totalSGST)]);
    if (totals.totalIGST > 0) totalsRows.push(['IGST', '', '', '', formatINR(totals.totalIGST)]);
    
    totalsRows.push(['Grand Total', '', '', '', formatINR(totals.grandTotal)]);

    autoTable(doc, {
      startY: currentY,
      head: [],
      body: totalsRows,
      theme: 'plain',
      showHead: 'never',
      margin: { left: margin, right: margin },
      styles: { halign: 'right' },
      columnStyles: { 0: { halign: 'right', fontStyle: 'bold' } },
      didDrawPage: (data) => {
        currentY = data.cursor.y;
      }
    });
    
    const lastRowY = currentY - 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: ${formatINR(totals.grandTotal)}`, 210 - margin, lastRowY, { align: 'right' });

    // QR Code Generation
    try {
      let qrData = '';
      if (invoice.qrCode) {
        // Official E-Invoice QR data
        qrData = invoice.qrCode;
      } else if (settings.upiId) {
        // UPI Payment Link: upi://pay?pa=upiid@bank&pn=Name&am=Amount&cu=INR
        qrData = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.businessName || 'Business')}&am=${(totals.grandTotal / 100).toFixed(2)}&cu=INR`;
      } else {
        // Invoice Summary
        qrData = `Invoice: ${invoice.invoiceNumber}\nDate: ${invoice.invoiceDate}\nTotal: ${formatINR(totals.grandTotal)}\nBusiness: ${settings.businessName}`;
      }

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        margin: 1,
        width: 100,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      // Place QR code on the right, above the signature
      doc.addImage(qrCodeDataUrl, 'PNG', 210 - margin - 25, currentY + 5, 25, 25);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.qrCode ? 'E-Invoice QR' : (settings.upiId ? 'Scan to Pay' : 'Invoice QR'), 210 - margin - 12.5, currentY + 32, { align: 'center' });
    } catch (qrError) {
      console.warn('QR Code generation failed', qrError);
    }

    if (docType === 'proforma') {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Note: GST amounts are estimates. GST will be charged on the actual tax invoice.', 105, currentY + 5, { align: 'center' });
      currentY += 10;
    }

    currentY += 10;

    // 6. Amount in Words
    doc.setFont('helvetica', 'bold');
    doc.text('Amount in Words:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(amountInWords(totals.grandTotal), margin + 40, currentY);

    currentY += 20;

    // 7. Signature Block
    doc.setFont('helvetica', 'bold');
    doc.text('For ' + (settings.businessName || 'Business'), 160, currentY);
    currentY += 10;
    doc.line(160, currentY + 15, 200, currentY + 15);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorised Signatory', 170, currentY + 20);

    // 8. Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a computer generated invoice', 105, 290, { align: 'center' });

    return {
      success: true,
      blob: doc.output('blob'),
      error: null
    };
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return {
      success: false,
      blob: null,
      error: error instanceof Error ? error.message : 'Failed to generate PDF'
    };
  }
}

export function downloadInvoicePDF(blob, invoiceNumber) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice_${invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke after a short delay to allow download to start on mobile
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
