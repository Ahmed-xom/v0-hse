import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Initialize email transporter
const transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Generate a secure temporary password
 */
export function generateTemporaryPassword(): string {
  return crypto.randomBytes(12).toString('hex').slice(0, 16).toUpperCase();
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  temporaryPassword: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Password Reset - HSE System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>Your password has been reset by an administrator. Your new temporary password is:</p>
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #333;">
              ${temporaryPassword}
            </p>
          </div>
          <p><strong>Important:</strong></p>
          <ul>
            <li>Use this temporary password to login to the HSE System</li>
            <li>Change this password immediately after logging in</li>
            <li>Do not share this password with anyone</li>
            <li>This temporary password will expire in 24 hours</li>
          </ul>
          <p>If you did not request a password reset, please contact the system administrator.</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            This is an automated message from the HSE System. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        Password Reset Request
        
        Hello ${userName},
        
        Your password has been reset by an administrator. Your new temporary password is:
        
        ${temporaryPassword}
        
        Important:
        - Use this temporary password to login to the HSE System
        - Change this password immediately after logging in
        - Do not share this password with anyone
        - This temporary password will expire in 24 hours
        
        If you did not request a password reset, please contact the system administrator.
        
        This is an automated message from the HSE System. Please do not reply to this email.
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Verify transporter connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email connection error:', error);
    return false;
  }
}
