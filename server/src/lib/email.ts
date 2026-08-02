import { Resend } from 'resend';

// Initialize Resend only if API key is provided
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'Gem Car Rentals <noreply@gemautorentals.com>';
const APP_NAME = 'Gem Car Rentals';
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
export async function sendWelcomeEmail(to: string, firstName: string): Promise<EmailResult> {
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

/**
 * Send a booking abandonment recovery email
 */
export async function sendAbandonmentRecoveryEmail(
  to: string,
  firstName: string,
  details: {
    abandonmentId: string;
    vehicleName: string;
    vehicleImage: string;
    dailyRate: number;
    startDate: string;
    endDate: string;
  }
): Promise<EmailResult> {
  const recoveryUrl = `${WEB_URL}/booking?recover=${details.abandonmentId}`;

  if (!isEmailConfigured()) {
    console.warn('Email not configured (RESEND_API_KEY missing). Recovery email not sent.');
    console.log(`[DEV] Recovery link for ${to}: ${recoveryUrl}`);
    return { success: true, messageId: 'dev-mode-no-email' };
  }

  // Calculate days with validation
  const start = new Date(details.startDate);
  const end = new Date(details.endDate);

  // Validate dates are valid and end is after start
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    console.error('Invalid dates for abandonment email:', {
      startDate: details.startDate,
      endDate: details.endDate,
    });
    return { success: false, error: 'Invalid date range' };
  }

  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const estimatedTotal = days * details.dailyRate;

  try {
    const { data, error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Complete Your ${APP_NAME} Reservation - Your Car is Waiting!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Reservation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">Hey ${firstName}, your car is still waiting!</h2>

              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #3f3f46;">
                We noticed you didn't complete your reservation. Don't worry - we saved your selection for you!
              </p>

              <!-- Vehicle Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 0;">
                    <img src="${details.vehicleImage}" alt="${details.vehicleName}" style="width: 100%; height: auto; display: block;">
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #18181b;">${details.vehicleName}</h3>
                    <p style="margin: 0 0 4px; font-size: 14px; color: #71717a;">
                      ${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} (${days} days)
                    </p>
                    <p style="margin: 8px 0 0; font-size: 20px; font-weight: 700; color: #18181b;">
                      $${details.dailyRate}/day <span style="font-size: 14px; font-weight: 400; color: #71717a;">• Est. Total: $${estimatedTotal}</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${recoveryUrl}" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); text-decoration: none; border-radius: 8px;">Complete My Reservation</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a; text-align: center;">
                This vehicle may have limited availability. Book now to secure your dates!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #a1a1aa;">
                Not interested? No worries - you can ignore this email.
              </p>
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
      console.error('Failed to send abandonment recovery email:', error);
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
 * Waiting-list welcome email.
 *
 * CAN-SPAM: every marketing email must carry a working unsubscribe link and a
 * physical postal address. Both are included below and must stay there.
 */
export async function sendWaitlistWelcomeEmail(
  to: string,
  name: string,
  unsubscribeToken: string
): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.warn('Email not configured. Waitlist welcome not sent to:', to);
    return { success: true, messageId: 'dev-mode-no-email' };
  }

  const unsubscribeUrl = `${WEB_URL}/unsubscribe?token=${unsubscribeToken}`;
  const firstName = (name || '').split(' ')[0] || 'there';

  try {
    const { data, error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You're on the list — ${APP_NAME}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're on the list</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5; padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(10,22,40,0.08);">

        <!-- header -->
        <tr>
          <td style="background:#0A1628; padding:36px 32px; text-align:center;">
            <div style="font-family:Georgia,'Times New Roman',serif; font-size:26px; letter-spacing:1px; color:#D4AF37; font-weight:bold;">GEM</div>
            <div style="font-family:Georgia,'Times New Roman',serif; font-size:15px; letter-spacing:4px; color:#7B9CC4; margin-top:4px;">CAR RENTALS</div>
          </td>
        </tr>

        <!-- body -->
        <tr>
          <td style="padding:36px 32px;">
            <h1 style="margin:0 0 16px; font-size:22px; color:#0A1628;">You're on the list, ${firstName}.</h1>
            <p style="margin:0 0 16px; font-size:15px; line-height:1.65; color:#42506b;">
              Thanks for your interest in Gem Car Rentals. We've saved your spot.
            </p>
            <p style="margin:0 0 16px; font-size:15px; line-height:1.65; color:#42506b;">
              As soon as vehicles become available, you'll be among the first to hear from us —
              with the details, the rates, and how to reserve one.
            </p>
            <p style="margin:0 0 28px; font-size:15px; line-height:1.65; color:#42506b;">
              We'll only email you when there's something worth telling you about. No noise.
            </p>

            <div style="text-align:center; margin:0 0 8px;">
              <a href="${WEB_URL}" style="display:inline-block; padding:14px 34px; font-size:15px; font-weight:700; color:#0A1628; background:#D4AF37; text-decoration:none; border-radius:8px;">Visit Our Site</a>
            </div>
          </td>
        </tr>

        <!-- questions -->
        <tr>
          <td style="padding:0 32px 32px;">
            <div style="border-top:1px solid #e8eaef; padding-top:20px; font-size:14px; line-height:1.6; color:#6b7689;">
              Questions in the meantime? Call <a href="tel:+18134224539" style="color:#8A6715; text-decoration:none; font-weight:600;">813-422-4539</a>
              or just reply to this email.
            </div>
          </td>
        </tr>

        <!-- footer: unsubscribe + postal address are legally required -->
        <tr>
          <td style="background:#f7f8fa; padding:22px 32px; text-align:center; font-size:12px; line-height:1.6; color:#8d95a5;">
            <div style="margin-bottom:8px;">
              You're receiving this because you joined the waiting list at gemrentalcars.com.
            </div>
            <div style="margin-bottom:10px;">
              <a href="${unsubscribeUrl}" style="color:#6b7689; text-decoration:underline;">Unsubscribe</a>
            </div>
            <div style="color:#a3aab8;">
              Gem Car Rentals &middot; 1311 E Canal St, Mulberry, FL 33860
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Waitlist welcome email error:', error);
      return { success: false, error: error.message };
    }
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('Waitlist welcome email exception:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Waiting-list campaign email — a one-off message written by staff.
 *
 * Sent to ONE recipient at a time by design. Putting many addresses in a single
 * To/CC exposes every subscriber's email to every other subscriber, which is a
 * privacy breach and the fastest way to get a sending domain blocklisted.
 *
 * CAN-SPAM: unsubscribe link and postal address are mandatory on marketing mail
 * and must not be removed.
 */
export async function sendWaitlistCampaignEmail(
  to: string,
  name: string,
  subject: string,
  bodyText: string,
  unsubscribeToken: string
): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.warn('Email not configured. Campaign email not sent to:', to);
    return { success: true, messageId: 'dev-mode-no-email' };
  }

  const unsubscribeUrl = `${WEB_URL}/unsubscribe?token=${unsubscribeToken}`;
  const firstName = (name || '').split(' ')[0] || 'there';

  // Staff write plain text; escape it so a stray < cannot break the layout or
  // inject markup, then honour paragraph breaks.
  const escaped = bodyText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const paragraphs = escaped
    .split(/\n\s*\n/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px; font-size:15px; line-height:1.65; color:#42506b;">${p.replace(/\n/g, '<br>')}</p>`
    )
    .join('');

  try {
    const { data, error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      headers: {
        // lets Gmail/Outlook show a native unsubscribe control, which measurably
        // reduces spam complaints versus people hunting for the footer link
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${subject}</title></head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5; padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(10,22,40,0.08);">
        <tr>
          <td style="background:#0A1628; padding:32px; text-align:center;">
            <div style="font-family:Georgia,'Times New Roman',serif; font-size:24px; letter-spacing:1px; color:#D4AF37; font-weight:bold;">GEM</div>
            <div style="font-family:Georgia,'Times New Roman',serif; font-size:14px; letter-spacing:4px; color:#7B9CC4; margin-top:3px;">CAR RENTALS</div>
          </td>
        </tr>
        <tr>
          <td style="padding:34px 32px;">
            <p style="margin:0 0 16px; font-size:15px; line-height:1.65; color:#42506b;">Hi ${firstName},</p>
            ${paragraphs}
            <div style="text-align:center; margin:28px 0 4px;">
              <a href="${WEB_URL}/vehicles" style="display:inline-block; padding:13px 30px; font-size:15px; font-weight:700; color:#0A1628; background:#D4AF37; text-decoration:none; border-radius:8px;">View Our Fleet</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f7f8fa; padding:22px 32px; text-align:center; font-size:12px; line-height:1.6; color:#8d95a5;">
            <div style="margin-bottom:8px;">You are receiving this because you joined the waiting list at gemrentalcars.com.</div>
            <div style="margin-bottom:10px;"><a href="${unsubscribeUrl}" style="color:#6b7689; text-decoration:underline;">Unsubscribe</a></div>
            <div style="color:#a3aab8;">Gem Car Rentals &middot; 1311 E Canal St, Mulberry, FL 33860</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
