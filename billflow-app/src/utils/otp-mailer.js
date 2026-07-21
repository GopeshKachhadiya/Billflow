var nodemailer = require('nodemailer');
var settings   = require('../db/queries/settings');

function generate6DigitOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getTransporter() {
  var allSettings = settings.getAllSettings() || {};
  
  var host = process.env.SMTP_HOST || allSettings.smtp_host || 'smtp.gmail.com';
  var port = parseInt(process.env.SMTP_PORT || allSettings.smtp_port || '465', 10);
  var user = process.env.SMTP_USER || allSettings.smtp_user || 'gopeshkachhadiya00005@gmail.com';
  var pass = process.env.SMTP_PASS || allSettings.smtp_pass || 'vydm exyu dyxl spda';

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465,
    auth: {
      user: user,
      pass: pass
    }
  });
}

function sendOTPEmail(recipientEmail, otpCode) {
  return new Promise(function(resolve, reject) {
    try {
      var transporter = getTransporter();
      var senderEmail = process.env.SMTP_USER || 'gopeshkachhadiya00005@gmail.com';

      var mailOptions = {
        from: '"BillFlow Security" <' + senderEmail + '>',
        to: recipientEmail,
        subject: 'Your BillFlow Password Reset Verification Code: ' + otpCode,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background-color: #5046e6; color: white; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; font-size: 24px; font-weight: bold;">B</div>
              <h2 style="color: #1f2937; margin-top: 12px; font-size: 20px;">Password Reset Request</h2>
            </div>
            
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">
              We received a request to reset the password for your BillFlow account (<strong>${recipientEmail}</strong>).
            </p>
            
            <p style="color: #4b5563; font-size: 14px; margin-top: 16px;">
              Your 6-digit OTP verification code is:
            </p>
            
            <div style="background-color: #f3f4f6; border: 2px dashed #6366f1; border-radius: 10px; padding: 16px; text-align: center; margin: 20px 0;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4338ca;">${otpCode}</span>
            </div>
            
            <p style="color: #6b7280; font-size: 12px; line-height: 1.4;">
              This code will expire in <strong>10 minutes</strong>. If you did not request this code, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 11px; text-align: center;">
              BillFlow Digital Ledger System &bull; Secure Cloud Authentication
            </p>
          </div>
        `
      };

      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          console.error('[otp-mailer] Failed to send email via SMTP:', error.message);
          resolve({ success: false, error: 'SMTP send failed: ' + error.message });
        } else {
          console.log('[otp-mailer] OTP email sent successfully:', info.response);
          resolve({ success: true, messageId: info.messageId });
        }
      });
    } catch (e) {
      console.error('[otp-mailer] Exception in sendOTPEmail:', e.message);
      resolve({ success: false, error: e.message });
    }
  });
}

module.exports = {
  generate6DigitOTP: generate6DigitOTP,
  sendOTPEmail: sendOTPEmail
};
