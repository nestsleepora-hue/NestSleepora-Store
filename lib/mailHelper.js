import nodemailer from 'nodemailer';

/**
 * Dispatches dynamic custom styled HTML OTP verification email to shopper/admin.
 */
export const sendOtpEmail = async (toEmail, otpCode) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`[EMAIL BYPASS] Email credentials missing. Printing OTP to console.`);
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.replace(/\s+/g, '')
      }
    });

    const mailOptions = {
      from: `"NestSleepora Security" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your NestSleepora Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1dbcf; border-radius: 8px; background-color: #fcfbfa;">
          <h2 style="color: #1b263b; border-bottom: 2px solid #c2b280; padding-bottom: 10px;">NestSleepora Security Code</h2>
          <p style="font-size: 14px; color: #555;">Hello,</p>
          <p style="font-size: 14px; color: #555;">A security check has been requested for your account. Please enter the following 6-digit verification code to finalize your security check:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #c2b280; background-color: #1b263b; padding: 12px 30px; border-radius: 6px; display: inline-block;">
              ${otpCode}
            </span>
          </div>
          <p style="font-size: 12px; color: #999;">This security code is active for 5 minutes. If you did not request this, please disregard this email.</p>
          <hr style="border: 0; border-top: 1px solid #e1dbcf; margin-top: 30px;" />
          <p style="font-size: 10px; color: #bbb; text-align: center;">&copy; ${new Date().getFullYear()} NestSleepora Sleep Products Inc.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL DISPATCH] Real email sent to ${toEmail}. MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('[EMAIL ERROR] Failed to send real email to:', toEmail, err);
    return false;
  }
};
