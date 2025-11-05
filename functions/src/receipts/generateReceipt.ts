// Generate Receipt Cloud Function
// Creates PDF receipt for donation and uploads to Cloud Storage

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import PDFDocument from 'pdfkit';
import { logInfo, logError } from '../utils/logger';

const db = admin.firestore();
const storage = admin.storage();

export const generateReceipt = functions.https.onRequest(async (req, res) => {
  try {
    // Validate HTTP method
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { donationId } = req.body;

    if (!donationId) {
      res.status(400).json({ error: 'donationId is required' });
      return;
    }

    logInfo('Starting receipt generation', { donationId });

    // Fetch donation data
    const donationDoc = await db.collection('donations').doc(donationId).get();
    
    if (!donationDoc.exists) {
      res.status(404).json({ error: 'Donation not found' });
      return;
    }

    const donationData = donationDoc.data();

    // Generate unique receipt number
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const receiptNumber = `RCP-${year}-${timestamp}${random}`;

    logInfo('Generated receipt number', { receiptNumber });

    // Create PDF
    const pdfBuffer = await createReceiptPDF(donationData, receiptNumber);

    // Upload PDF to Cloud Storage
    const bucket = storage.bucket();
    const fileName = `receipts/${receiptNumber}.pdf`;
    const file = bucket.file(fileName);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          donationId: donationId,
          receiptNumber: receiptNumber,
        },
      },
    });

    // Make file publicly accessible
    await file.makePublic();
    
    const receiptUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update donation document
    await donationDoc.ref.update({
      receiptNumber: receiptNumber,
      receiptUrl: receiptUrl,
      receiptGenerated: true,
      receiptGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logInfo('Receipt generated successfully', { donationId, receiptNumber, receiptUrl });

    // TODO: Trigger email sending (T100)
    // This would call sendReceiptEmail function

    res.status(200).json({
      success: true,
      receiptNumber,
      receiptUrl,
    });
  } catch (error: any) {
    logError('Error generating receipt', error);
    res.status(500).json({ error: 'Receipt generation failed' });
  }
});

async function createReceiptPDF(donationData: any, receiptNumber: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .text('קבלה על תרומה', { align: 'center' })
        .moveDown();

      // Receipt Number
      doc
        .fontSize(14)
        .text(`מספר קבלה: ${receiptNumber}`, { align: 'right' })
        .text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, { align: 'right' })
        .moveDown();

      // NGO Info
      doc
        .fontSize(16)
        .text('פרטי העמותה', { align: 'right' })
        .fontSize(12)
        .text(`שם: ${donationData.ngoName || 'N/A'}`, { align: 'right' })
        .moveDown();

      // Donor Info (if not anonymous)
      if (!donationData.isAnonymous && donationData.userName) {
        doc
          .fontSize(16)
          .text('פרטי התורם', { align: 'right' })
          .fontSize(12)
          .text(`שם: ${donationData.userName}`, { align: 'right' })
          .text(`אימייל: ${donationData.userEmail}`, { align: 'right' })
          .moveDown();
      } else {
        doc
          .fontSize(16)
          .text('תרומה אנונימית', { align: 'right' })
          .moveDown();
      }

      // Donation Details
      const amount = (donationData.amount / 100).toFixed(2);
      doc
        .fontSize(16)
        .text('פרטי התרומה', { align: 'right' })
        .fontSize(12)
        .text(`סכום: ₪${amount}`, { align: 'right' })
        .text(`עבור: ${donationData.storyTitle || 'N/A'}`, { align: 'right' })
        .moveDown();

      // Legal Text
      doc
        .fontSize(10)
        .text('קבלה זו מהווה אישור לתרומה ומתאימה לדרישות רשות המיסים.', { 
          align: 'center',
        })
        .moveDown();

      // Footer
      doc
        .fontSize(8)
        .text('מופק על ידי פלטפורמת המעשר', { align: 'center' })
        .text(`נוצר ב-${new Date().toLocaleString('he-IL')}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
