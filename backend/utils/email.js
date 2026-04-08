import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTPEmail = async (toEmail, otpCode, username) => {
  const mailOptions = {
    from: `"One Tap Study" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Your Verification Code — One Tap Study',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0A; color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #2A2A2A;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #F97316; margin: 0;">One Tap Study</h1>
        </div>
        <p style="color: #e2e8f0; font-size: 16px;">Hello ${username || 'Student'},</p>
        <p style="color: #e2e8f0; font-size: 16px;">Here is your verification code to access your study platform. This code expires in 10 minutes.</p>
        
        <div style="background-color: #1A1A1A; border: 1px solid #F97316; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #F97316;">${otpCode}</span>
        </div>
        
        <p style="color: #94a3b8; font-size: 14px; margin-top: 40px;">If you didn't request this code, you can safely ignore this email.</p>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #2A2A2A; color: #64748b; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} One Tap Study. Securely verifying students.</p>
        </div>
      </div>
    `
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP credentials not set! OTP would be:', otpCode);
      // Fallback for dev mode without email setup
      return true;
    }
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
};
