const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // Or your SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a verification code email for AmstaPay signup.
 * @param {string} to - User's email
 * @param {string} fullName - User's full name
 * @param {string|number} code - 6-digit verification code
 */
exports.sendVerificationCodeEmail = async (to, fullName, code) => {
  const htmlContent = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background-color: #f97316; color: white; text-align: center; padding: 40px 20px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Welcome to AmstaPay 🚀</h1>
        <p style="margin: 10px 0 0; font-size: 16px;">Secure • Fast • Reliable Payments</p>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px; color: #333;">
        <h2 style="font-size: 22px; margin-top: 0;">Hi ${fullName},</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          Thank you for signing up with <strong>AmstaPay</strong>. Use the verification code below to activate your account in the mobile app:
        </p>

        <!-- Verification Code -->
        <div style="text-align: center; margin: 40px 0;">
          <span style="
            display: inline-block;
            background-color: #f97316;
            color: #ffffff;
            font-size: 30px;
            font-weight: bold;
            padding: 20px 40px;
            border-radius: 8px;
            letter-spacing: 6px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          ">
            ${code}
          </span>
        </div>

        <p style="font-size: 14px; color: #555; line-height: 1.6;">
          This code will expire in <b>10 minutes</b> for your security. Do not share this code with anyone.
        </p>

        <p style="font-size: 14px; color: #555;">
          If you did not create an AmstaPay account, you can safely ignore this message.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

        <p style="font-size: 13px; color: #999; text-align: center;">
          Need help? Contact our support team anytime at 
          <a href="mailto:support@amstapay.com" style="color:#f97316; text-decoration:none;">support@amstapay.com</a>
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #fafafa; color: #888; text-align: center; padding: 20px; font-size: 12px;">
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} AmstaPay Inc. All rights reserved.</p>
        <p style="margin: 0;">123 Payment Lane, Lagos, Nigeria</p>
      </div>

    </div>
  </div>
  `;

  await transporter.sendMail({
    from: `"AmstaPay" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your AmstaPay Verification Code",
    html: htmlContent,
  });
};


/**
 * Sends a reset password email for AmstaPay.
 * @param {string} to - User's email
 * @param {string} name - User's full name
 * @param {string} token - Password reset token
 */
exports.sendResetPasswordEmail = async (to, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const htmlContent = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">

      <!-- Header -->
      <div style="background-color: #f97316; color: white; text-align: center; padding: 40px 20px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Reset Your AmstaPay Password 🔑</h1>
        <p style="margin: 10px 0 0; font-size: 16px;">Secure • Fast • Reliable Payments</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px; color: #333;">
        <h2 style="font-size: 22px; margin-top: 0;">Hi ${name},</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          We received a request to reset your AmstaPay account password associated with <strong>${to}</strong>.
        </p>

        <p style="font-size: 16px; line-height: 1.6;">
          Click the button below to reset your password. This link is valid for <b>15 minutes</b>.
        </p>

        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetUrl}" style="
            display: inline-block;
            background-color: #f97316;
            color: #ffffff;
            font-size: 18px;
            font-weight: bold;
            padding: 15px 30px;
            border-radius: 8px;
            text-decoration: none;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          ">
            Reset Password
          </a>
        </div>

        <p style="font-size: 14px; color: #555; line-height: 1.6;">
          If you didn't request a password reset, you can safely ignore this email and your password will remain unchanged.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

        <p style="font-size: 13px; color: #999; text-align: center;">
          Need help? Contact our support team anytime at 
          <a href="mailto:support@amstapay.com" style="color:#f97316; text-decoration:none;">support@amstapay.com</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #fafafa; color: #888; text-align: center; padding: 20px; font-size: 12px;">
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} AmstaPay Inc. All rights reserved.</p>
        <p style="margin: 0;">123 Payment Lane, Lagos, Nigeria</p>
      </div>

    </div>
  </div>
  `;

  await transporter.sendMail({
    from: `"AmstaPay" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset Your AmstaPay Password",
    html: htmlContent,
  });
};
