import { Resend } from 'resend';

// Initialize Resend only if API key is provided
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'Gem Auto Rentals <noreply@gemautorentals.com>';
const APP_NAME = 'Gem Auto Rentals';
const WEB_URL = process.env.WEB_URL || 'http://localhost:5173';

// Check if email is configured
function isEmailConfigured(): boolean {
  return resend !== null;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a password reset email with a reset link
 */
export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetToken: string
): Promise<EmailResult> {
  const resetUrl = `${WEB_URL}/reset-password?token=${resetToken}`;

  if (!isEmailConfigured()) {
    console.warn('Email not configured (RESEND_API_KEY missing). Password reset email not sent.');
    console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
    return { success: true, messageId: 'dev-mode-no-email' };
  }

  try {
    const { data, error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Reset Your ${APP_NAME} Password`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">Password Reset Request</h2>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52525b;">Hi ${firstName},</p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52525b;">We received a request to reset your password. Click the button below to create a new password:</p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); text-decoration: none; border-radius: 8px;">Reset Password</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #71717a;">This link will expire in 1 hour for security reasons.</p>
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #71717a;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

              <!-- Fallback URL -->
              <p style="margin: 24px 0 0; padding: 16px; font-size: 12px; line-height: 1.6; color: #a1a1aa; background-color: #f4f4f5; border-radius: 6px; word-break: break-all;">
                If the button doesn't work, copy and paste this link into your browser:<br><br>
                <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 13px; color: #a1a1aa;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('Email service error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Send a welcome email after registration
 */
export async function sendWelcomeEmail(
  to: string,
  firstName: string
): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.warn('Email not configured. Welcome email not sent to:', to);
    return { success: true, messageId: 'dev-mode-no-email' };
  }

  try {
    const { data, error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to ${APP_NAME}!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">Welcome aboard, ${firstName}!</h2>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52525b;">Thank you for joining ${APP_NAME}. We're excited to have you as part of our community.</p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52525b;">You can now browse our fleet of premium vehicles and book your next rental with ease.</p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${WEB_URL}/vehicles" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); text-decoration: none; border-radius: 8px;">Browse Vehicles</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a;">Need help? Our support team is always here to assist you.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 13px; color: #a1a1aa;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('Email service error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Send a booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  to: string,
  firstName: string,
  bookingDetails: {
    bookingId: string;
    vehicleName: string;
    startDate: string;
    endDate: string;
    pickupLocation: string;
    totalAmount: string;
  }
): Promise<EmailResult> {
  const bookingUrl = `${WEB_URL}/dashboard/bookings`;

  if (!isEmailConfigured()) {
    console.warn('Email not configured. Booking confirmation not sent to:', to);
    return { success: true, messageId: 'dev-mode-no-email' };
  }

  try {
    const { data, error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Booking Confirmed - ${bookingDetails.vehicleName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Booking Confirmed!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52525b;">Hi ${firstName}, your booking has been confirmed.</p>

              <!-- Booking Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px; background-color: #f4f4f5; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #71717a;">Vehicle</td>
                        <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #18181b; text-align: right;">${bookingDetails.vehicleName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #71717a;">Pickup Date</td>
                        <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #18181b; text-align: right;">${bookingDetails.startDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #71717a;">Return Date</td>
                        <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #18181b; text-align: right;">${bookingDetails.endDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #71717a;">Pickup Location</td>
                        <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #18181b; text-align: right;">${bookingDetails.pickupLocation}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 16px; border-top: 1px solid #e4e4e7;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #18181b;">Total</td>
                        <td style="padding: 8px 0; font-size: 18px; font-weight: 700; color: #3b82f6; text-align: right;">${bookingDetails.totalAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #71717a;">Booking ID: <strong>${bookingDetails.bookingId}</strong></p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${bookingUrl}" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); text-decoration: none; border-radius: 8px;">View My Bookings</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a;">Please bring your driver's license and booking confirmation when picking up your vehicle.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 13px; color: #a1a1aa;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    });

    if (error) {
      console.error('Failed to send booking confirmation email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('Email service error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
