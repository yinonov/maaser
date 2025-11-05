// Send Receipt Email Cloud Function
// Sends donation receipt to donor via SendGrid

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';
import { logInfo, logError } from '../utils/logger';

const db = admin.firestore();

// Initialize SendGrid
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

export const sendReceiptEmail = functions.https.onRequest(async (req, res) => {
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

    if (!sendGridApiKey) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    logInfo('Sending receipt email', { donationId });

    // Fetch donation data
    const donationDoc = await db.collection('donations').doc(donationId).get();
    
    if (!donationDoc.exists) {
      res.status(404).json({ error: 'Donation not found' });
      return;
    }

    const donationData = donationDoc.data();

    if (!donationData?.userEmail) {
      res.status(400).json({ error: 'User email not found' });
      return;
    }

    if (!donationData?.receiptUrl) {
      res.status(400).json({ error: 'Receipt not generated yet' });
      return;
    }

    // Prepare email
    const amount = (donationData.amount / 100).toFixed(2);
    const msg = {
      to: donationData.userEmail,
      from: 'noreply@hamaaser.org', // TODO: Configure verified sender domain
      subject: `קבלה על תרומה - ${donationData.receiptNumber}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4a373;">תודה על תרומתך!</h2>
          
          <p>שלום ${donationData.userName || 'תורם יקר'},</p>
          
          <p>תודה רבה על תרומתך של <strong>₪${amount}</strong> לטובת ${donationData.storyTitle}.</p>
          
          <p>התרומה שלך עוזרת לנו להמשיך בעבודתנו החשובה.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">פרטי התרומה:</h3>
            <p><strong>מספר קבלה:</strong> ${donationData.receiptNumber}</p>
            <p><strong>סכום:</strong> ₪${amount}</p>
            <p><strong>תאריך:</strong> ${new Date(donationData.paidAt?.toDate()).toLocaleDateString('he-IL')}</p>
            <p><strong>עבור:</strong> ${donationData.storyTitle}</p>
            <p><strong>ארגון:</strong> ${donationData.ngoName}</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${donationData.receiptUrl}" 
               style="display: inline-block; background-color: #E87A5D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              הורד קבלה
            </a>
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            קבלה זו מהווה אישור לתרומה ומתאימה לדרישות רשות המיסים.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            המעשר - פלטפורמה לתרומות חכמות<br>
            © ${new Date().getFullYear()} כל הזכויות שמורות
          </p>
        </div>
      `,
    };

    // Send email
    await sgMail.send(msg);

    // Update donation document
    await donationDoc.ref.update({
      receiptSent: true,
      receiptSentAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logInfo('Receipt email sent successfully', { 
      donationId,
      email: donationData.userEmail,
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error: any) {
    logError('Error sending receipt email', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});
