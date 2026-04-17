const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles all outgoing email notifications via Nodemailer.
 * Requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME in .env
 */

// ─── Singleton transporter ───────────────────────────────────────────────────
let _transporter = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }
  return _transporter;
}

// ─── HTML escaping ────────────────────────────────────────────────────────────
const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"'/]/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FROM_ADDRESS = () =>
  `"${process.env.SMTP_FROM_NAME || 'Placement Cell'}" <${process.env.SMTP_USER}>`;

const PORTAL_URL = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

function smtpConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

// ─── EmailService ─────────────────────────────────────────────────────────────
class EmailService {
  /**
   * Verify SMTP configuration + connectivity.
   */
  static async verifyConnection() {
    if (!smtpConfigured()) {
      return {
        configured: false,
        ok: false,
        reason: 'SMTP_USER/SMTP_PASS missing',
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
      };
    }

    try {
      await getTransporter().verify();
      return {
        configured: true,
        ok: true,
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
      };
    } catch (err) {
      return {
        configured: true,
        ok: false,
        error: err.message,
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
      };
    }
  }
  /**
   * Send an invitation email asking a student to submit their interview experience.
   */
  static async sendExperienceInvitation({ to, studentName, companyName }) {
    if (!to || typeof to !== 'string' || !to.trim()) {
      console.warn('[EmailService] sendExperienceInvitation: missing `to` address — skipping');
      return;
    }

    if (!smtpConfigured()) {
      console.warn('[EmailService] SMTP not configured — skipping invitation email to', to);
      return;
    }

    const safeName    = escHtml(studentName);
    const safeCompany = escHtml(companyName);

    const greeting     = safeName    ? `Hi ${safeName}`                          : 'Hello';
    const companyLine  = safeCompany ? ` with <strong>${safeCompany}</strong>`   : '';
    const subjectComp  = companyName ? ` – ${companyName}` : '';

    try {
        await getTransporter().sendMail({
        from: FROM_ADDRESS(),
        to: to.trim(),
        subject: `Share Your Interview Experience${subjectComp}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #1a56db;">Interview Experience Submission</h2>
            <p>${greeting},</p>
            <p>
                Congratulations on completing your interview process${companyLine}! 🎉
            </p>
            <p>
                Your experience is incredibly valuable to your junior batchmates who are preparing
                for placements. We'd love for you to take a few minutes to share your interview
                details on the <strong>Placement Community Portal</strong>.
            </p>
            <p>Your contribution helps future students:</p>
            <ul>
                <li>Understand the interview process and rounds</li>
                <li>Prepare for common questions and topics</li>
                <li>Gauge the difficulty level and tips</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
                <a
                href="${PORTAL_URL()}/student/experience/add"
                style="
                    background-color: #1a56db; color: white; padding: 12px 28px;
                    border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;
                "
                >
                Add My Interview Experience
                </a>
            </div>
            <p style="color: #666; font-size: 13px;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${PORTAL_URL()}/student/experience/add">${PORTAL_URL()}/student/experience/add</a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">
                This email was sent by your institution's Placement Cell.
                If you believe this was sent in error, please ignore it.
            </p>
            </div>
        `,
        });
        console.log(`[EmailService] Experience invitation sent to ${to}`);
    } catch (err) {
        console.error(`[EmailService] Error sending invitation to ${to}:`, err.message);
    }
  }

  /**
   * Send an approval notification email to a student.
   */
  static async sendApprovalNotification({ to, studentName, companyName, comment }) {
    if (!to || typeof to !== 'string' || !to.trim()) {
      console.warn('[EmailService] sendApprovalNotification: missing `to` address — skipping');
      return;
    }

    if (!smtpConfigured()) {
      console.warn('[EmailService] SMTP not configured — skipping approval email to', to);
      return;
    }

    const safeName    = escHtml(studentName);
    const safeCompany = escHtml(companyName);
    const safeComment = escHtml(comment);

    const greeting    = safeName    ? `Hi ${safeName}`                        : 'Hello';
    const companyLine = safeCompany ? ` for <strong>${safeCompany}</strong>`  : '';

    try {
        await getTransporter().sendMail({
        from: FROM_ADDRESS(),
        to: to.trim(),
        subject: `Your Interview Experience Has Been Approved ✅`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #057a55;">Experience Approved!</h2>
            <p>${greeting},</p>
            <p>
                Great news! Your interview experience submission${companyLine} has been
                <strong style="color: #057a55;">approved</strong> and is now live on the
                Placement Community Portal.
            </p>
            <p>
                Your contribution will help many junior students prepare better for their placements.
                Thank you for taking the time to share! 🙏
            </p>
            ${safeComment ? `
            <div style="background: #f0fdf4; border-left: 4px solid #057a55; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                <strong>Admin Comment:</strong><br/>${safeComment}
            </div>` : ''}
            <div style="text-align: center; margin: 30px 0;">
                <a
                href="${PORTAL_URL()}/student/experiences"
                style="
                    background-color: #057a55; color: white; padding: 12px 28px;
                    border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;
                "
                >
                View My Experiences
                </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">
                This email was sent by your institution's Placement Cell.
            </p>
            </div>
        `,
        });
        console.log(`[EmailService] Approval notification sent to ${to}`);
    } catch (err) {
         console.error(`[EmailService] Error sending approval to ${to}:`, err.message);
    }
  }

  /**
   * Send a rejection notification email to a student.
   */
  static async sendRejectionNotification({ to, studentName, companyName, reason }) {
    if (!to || typeof to !== 'string' || !to.trim()) {
      console.warn('[EmailService] sendRejectionNotification: missing `to` address — skipping');
      return;
    }

    if (!smtpConfigured()) {
      console.warn('[EmailService] SMTP not configured — skipping rejection email to', to);
      return;
    }

    const safeName    = escHtml(studentName);
    const safeCompany = escHtml(companyName);
    const safeReason  = escHtml(reason);

    const greeting    = safeName    ? `Hi ${safeName}`                        : 'Hello';
    const companyLine = safeCompany ? ` for <strong>${safeCompany}</strong>`  : '';

    try {
        await getTransporter().sendMail({
        from: FROM_ADDRESS(),
        to: to.trim(),
        subject: `Update on Your Interview Experience Submission`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #c81e1e;">Experience Submission Update</h2>
            <p>${greeting},</p>
            <p>
                Thank you for submitting your interview experience${companyLine}. After review,
                your submission has not been approved at this time.
            </p>
            ${safeReason ? `
            <div style="background: #fdf2f2; border-left: 4px solid #c81e1e; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                <strong>Reason:</strong><br/>${safeReason}
            </div>` : ''}
            <p>
                You are welcome to revise your submission and resubmit it through the portal.
                If you have questions, please reach out to the Placement Cell.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a
                href="${PORTAL_URL()}/student/experience/add"
                style="
                    background-color: #1a56db; color: white; padding: 12px 28px;
                    border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;
                "
                >
                Resubmit Experience
                </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">
                This email was sent by your institution's Placement Cell.
            </p>
            </div>
        `,
        });
        console.log(`[EmailService] Rejection notification sent to ${to}`);
    } catch (err) {
         console.error(`[EmailService] Error sending rejection to ${to}:`, err.message);
    }
  }
}

module.exports = EmailService;
