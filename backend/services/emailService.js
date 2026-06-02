const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate verification code
const generateVerificationCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Send verification email
const sendVerificationEmail = async (email, code) => {
  try {
    console.log('Attempting to send verification email to:', email);
    console.log('Email configuration:', {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 465,
      user: process.env.EMAIL_USER ? '✓ Set' : '✗ Missing',
      pass: process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing'
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification - KothaChaiyo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff416c;">Welcome to KothaChaiyo!</h2>
          <p>Thank you for signing up. To complete your registration, please use the following verification code:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="color: #ff416c; letter-spacing: 5px; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't sign up for KothaChaiyo, please ignore this email.</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The KothaChaiyo Team
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Email sending error details:', {
      error: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, code) => {
  try {
    console.log('Attempting to send password reset email to:', email);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset - KothaChaiyo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff416c;">Password Reset Request</h2>
          <p>We received a request to reset your password. Please use the following code to reset your password:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="color: #ff416c; letter-spacing: 5px; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The KothaChaiyo Team
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Password reset email error:', error);
    return false;
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail
}; 