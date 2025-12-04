const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendOTPEmail(email, otp) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Fraud Detection Login - Do Not Share',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Security Verification</h2>
            <p>We detected a login attempt from a new device or location.</p>
            <p style="font-size: 16px;">Your One-Time Password (OTP) is:</p>
            <div style="background-color: #f0f0f0; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #007bff; letter-spacing: 2px;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes.</p>
            <p style="color: #ff6b6b;">⚠️ Never share this code with anyone.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw error;
    }
  }

  async sendSuspiciousLoginAlert(email, details) {
    try {
      const { city, country, browser, timestamp } = details;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '🚨 Suspicious Login Alert - Action Required',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff6b6b;">⚠️ Suspicious Login Detected</h2>
            <p>We detected a suspicious login attempt on your account.</p>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <tr style="background-color: #f0f0f0;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Location</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${city}, ${country}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Device</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${browser}</td>
              </tr>
              <tr style="background-color: #f0f0f0;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Time</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${timestamp}</td>
              </tr>
            </table>
            <p style="color: #333; margin: 20px 0;">
              <strong>What should you do?</strong><br>
              • If this was you, no action is needed.<br>
              • If this wasn't you, please change your password immediately.<br>
              • Enable two-factor authentication for added security.
            </p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px;">This is an automated security alert from Fraud Detection System.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Suspicious login alert sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending suspicious login alert:', error);
      throw error;
    }
  }

  async sendAccountLockedAlert(email, reason) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '🔒 Your Account Has Been Locked',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff6b6b;">🔒 Account Locked</h2>
            <p>Your account has been temporarily locked for security reasons.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p style="margin: 20px 0; background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 3px;">
              Your account will be automatically unlocked in 30 minutes. If you believe this is a mistake, please contact support.
            </p>
            <p style="color: #666; font-size: 14px;">
              • Do not attempt to log in multiple times<br>
              • Verify your identity through the recovery email<br>
              • Contact support if you need immediate access
            </p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px;">This is an automated security alert from Fraud Detection System.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Account locked alert sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending account locked alert:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
