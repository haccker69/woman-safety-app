const nodemailer = require('nodemailer');
const axios = require('axios');
const { Resend } = require('resend');
const { logEmailOTP, logSOSEmail } = require('./simpleEmailService');

// Use Brevo for production (preferred), fallback to SMTP for development
const useBrevo = process.env.BREVO_API_KEY && process.env.NODE_ENV === 'production';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

const getBrevoTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // TLS
    auth: {
      user: process.env.BREVO_API_KEY,
      pass: process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY, // Brevo uses API key as password
    },
    connectionTimeout: 120000,
    greetingTimeout: 60000,
    socketTimeout: 120000,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  });
};

// Brevo REST API function (works in all environments)
const sendBrevoEmail = async (to, subject, htmlContent) => {
  try {
    // Check if API key is valid (not placeholder)
    if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY.includes('your_api_key_here')) {
      console.log(`[EMAIL] ⚠️ Brevo API key is placeholder or missing. Using console fallback.`);
      return logEmailOTP(to, to.split('@')[0], 'PLACEHOLDER-OTP');
    }

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'Women Safety System',
          email: FROM_EMAIL
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    console.log(`[EMAIL] ✅ Email sent via Brevo API to ${to}, messageId: ${response.data?.messageId}`);
    return { success: true, messageId: response.data?.messageId };
  } catch (error) {
    console.error('[EMAIL] Brevo API error:', error.response?.data || error.message);
    
    // If API key is invalid, fallback to console logging
    if (error.response?.data?.code === 'unauthorized' || error.response?.data?.message?.includes('Key not found')) {
      console.log(`[EMAIL] ⚠️ Invalid Brevo API key. Using console fallback for development.`);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      return logEmailOTP(to, to.split('@')[0], otp);
    }
    
    throw new Error(`Brevo API failed: ${error.response?.data?.message || error.message}`);
  }
};

const getTransporter = () => {
  // Check if email configuration is available
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email configuration missing. Please check EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD environment variables.');
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Ultra-enhanced configuration for production reliability
    connectionTimeout: 300000, // 5 minutes
    greetingTimeout: 180000,    // 3 minutes
    socketTimeout: 300000,    // 5 minutes
    pool: false, // Disable pooling for better connection handling
    // Add TLS options for better compatibility
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
      minVersion: 'TLSv1.2'
    },
    // Add additional connection options
    name: process.env.EMAIL_HOST,
    localAddress: undefined, // Let system choose
    // Disable debug logging to reduce noise
    debug: false,
    logger: false
  });
};

// Fallback transporter with different configuration
const getFallbackTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Try SSL port
    secure: true, // SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: 300000,
    greetingTimeout: 180000,
    socketTimeout: 300000,
    pool: false,
    tls: {
      rejectUnauthorized: false
    }
  });
};

const FROM_EMAIL = useBrevo 
  ? (process.env.BREVO_FROM_EMAIL || process.env.EMAIL_USER)
  : process.env.EMAIL_USER;

// Send SOS Email Alert
const sendSOSEmail = async (guardians, userName, userPhone, lat, lng) => {
  try {
    let transporter;
    
    if (useBrevo) {
      // Use Brevo REST API for production (works in all environments)
      console.log(`[EMAIL] Using Brevo REST API for SOS alerts`);
      
      const sosHtmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff3cd; border: 2px solid #ff0000;">
          <h1 style="color: #ff0000; text-align: center;">⚠️ EMERGENCY ALERT ⚠️</h1>
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333;">Emergency SOS Triggered</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              <strong>${userName}</strong> has triggered an emergency SOS alert. They may need immediate assistance.
            </p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #333;">Contact Information:</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${userName}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${userPhone}</p>
            </div>
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #333;">Current Location:</h3>
              <p style="margin: 5px 0;"><strong>Latitude:</strong> ${lat}</p>
              <p style="margin: 5px 0;"><strong>Longitude:</strong> ${lng}</p>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="https://www.google.com/maps?q=${lat},${lng}" style="display: inline-block; padding: 15px 30px; background-color: #ff0000; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                📍 VIEW LOCATION ON GOOGLE MAPS
              </a>
            </div>
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #ff0000;">
              <p style="margin: 0; color: #721c24; font-weight: bold;">
                ⚠️ Please contact ${userName} immediately or call emergency services if needed.
              </p>
            </div>
          </div>
          <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
            <p>This is an automated emergency alert from Women Safety & Security System</p>
            <p>Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
      
      // Send to all guardians using Brevo API
      const emailPromises = guardians.map(guardian => 
        sendBrevoEmail(guardian.email, '🚨 EMERGENCY SOS ALERT 🚨', sosHtmlContent)
      );
      
      await Promise.all(emailPromises);
      console.log(`[EMAIL] ✅ SOS emails sent via Brevo API to ${guardians.length} guardians`);
      return { success: true, message: `SOS alert sent to ${guardians.length} guardian(s)` };
    } else {
      // Use local SMTP for development
      transporter = getTransporter();
    }
    
    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const emailPromises = guardians.map(guardian =>
      transporter.sendMail({
        from: `Women Safety System <${FROM_EMAIL}>`,
        to: guardian.email,
        subject: '🚨 EMERGENCY SOS ALERT 🚨',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff3cd; border: 2px solid #ff0000;">
            <h1 style="color: #ff0000; text-align: center;">⚠️ EMERGENCY ALERT ⚠️</h1>
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333;">Emergency SOS Triggered</h2>
              <p style="font-size: 16px; line-height: 1.6;">
                <strong>${userName}</strong> has triggered an emergency SOS alert. They may need immediate assistance.
              </p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #333;">Contact Information:</h3>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${userName}</p>
                <p style="margin: 5px 0;"><strong>Phone:</strong> ${userPhone}</p>
              </div>
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #333;">Current Location:</h3>
                <p style="margin: 5px 0;"><strong>Latitude:</strong> ${lat}</p>
                <p style="margin: 5px 0;"><strong>Longitude:</strong> ${lng}</p>
              </div>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${mapLink}" style="display: inline-block; padding: 15px 30px; background-color: #ff0000; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  📍 VIEW LOCATION ON GOOGLE MAPS
                </a>
              </div>
              <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #ff0000;">
                <p style="margin: 0; color: #721c24; font-weight: bold;">
                  ⚠️ Please contact ${userName} immediately or call emergency services if needed.
                </p>
              </div>
            </div>
            <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
              <p>This is an automated emergency alert from Women Safety & Security System</p>
              <p>Timestamp: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `
      })
    );
    await Promise.all(emailPromises);
    console.log(`[EMAIL] ✅ SOS emails sent to ${guardians.length} guardians via ${useBrevo ? 'Brevo' : 'Local SMTP'}`);
    return { success: true, message: `SOS alert sent to ${guardians.length} guardian(s)` };
  } catch (error) {
    console.error('[EMAIL] SOS email error:', error.message);
    console.log('[EMAIL] Using fallback: logging SOS to console');
    
    // Fallback: log SOS to console
    return logSOSEmail(guardians, userName, userPhone, lat, lng);
  }
};

// Send Email Verification OTP
const sendVerificationEmail = async (email, name, otp) => {
  try {
    console.log(`[EMAIL] Attempting to send verification email to ${email}`);
    console.log(`[EMAIL] Using ${useBrevo ? 'Brevo SMTP' : 'Local SMTP'} for email sending`);
    
    if (useBrevo) {
      // Use Brevo REST API for production (works in all environments)
      console.log(`[EMAIL] Using Brevo REST API - FROM: ${FROM_EMAIL}`);
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #dc2626; margin: 0;">🛡️ Women Safety System</h1>
            <p style="color: #666; margin-top: 5px;">Email Verification</p>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              Thank you for registering! Please use the following OTP to verify your email address:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; padding: 15px 40px; background-color: #dc2626; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px;">
                ${otp}
              </div>
            </div>
            <p style="font-size: 14px; color: #888; text-align: center;">
              This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.
            </p>
          </div>
          <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
            <p>If you didn't create an account, please ignore this email.</p>
            <p>Women Safety & Security System &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      `;
      
      return await sendBrevoEmail(email, 'Verify Your Email - Women Safety System', htmlContent);
    } else {
      // Use SMTP with fallback logic
      console.log(`[EMAIL] SMTP config - HOST: ${process.env.EMAIL_HOST}, PORT: ${process.env.EMAIL_PORT}, USER: ${process.env.EMAIL_USER}`);
      
      let transporter = getTransporter();
      let info;
      
      try {
        // Try primary transporter
        console.log(`[EMAIL] Attempting primary SMTP connection...`);
        await transporter.verify();
        console.log(`[EMAIL] Primary SMTP connection verified successfully`);
        
        info = await transporter.sendMail({
          from: `Women Safety System <${FROM_EMAIL}>`,
          to: email,
          subject: 'Verify Your Email - Women Safety System',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #dc2626; margin: 0;">🛡️ Women Safety System</h1>
                <p style="color: #666; margin-top: 5px;">Email Verification</p>
              </div>
              <div style="background-color: white; padding: 30px; border-radius: 8px;">
                <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #555;">
                  Thank you for registering! Please use the following OTP to verify your email address:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <div style="display: inline-block; padding: 15px 40px; background-color: #dc2626; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px;">
                    ${otp}
                  </div>
                </div>
                <p style="font-size: 14px; color: #888; text-align: center;">
                  This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.
                </p>
              </div>
              <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                <p>If you didn't create an account, please ignore this email.</p>
                <p>Women Safety & Security System &copy; ${new Date().getFullYear()}</p>
              </div>
            </div>
          `
        });
        console.log(`[EMAIL] ✅ Verification email sent via primary SMTP to ${email}, id: ${info?.messageId}`);
        return { success: true };
      } catch (primaryError) {
        console.log(`[EMAIL] Primary SMTP failed, trying fallback...`);
        console.error(`[EMAIL] Primary error: ${primaryError.message}`);
        
        try {
          // Try fallback transporter
          transporter = getFallbackTransporter();
          console.log(`[EMAIL] Attempting fallback SMTP (SSL port 465)...`);
          await transporter.verify();
          console.log(`[EMAIL] Fallback SMTP connection verified successfully`);
          
          info = await transporter.sendMail({
            from: `Women Safety System <${FROM_EMAIL}>`,
            to: email,
            subject: 'Verify Your Email - Women Safety System',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #dc2626; margin: 0;">🛡️ Women Safety System</h1>
                  <p style="color: #666; margin-top: 5px;">Email Verification</p>
                </div>
                <div style="background-color: white; padding: 30px; border-radius: 8px;">
                  <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
                  <p style="font-size: 16px; line-height: 1.6; color: #555;">
                    Thank you for registering! Please use the following OTP to verify your email address:
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; padding: 15px 40px; background-color: #dc2626; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px;">
                      ${otp}
                    </div>
                  </div>
                  <p style="font-size: 14px; color: #888; text-align: center;">
                    This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.
                  </p>
                </div>
                <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                  <p>If you didn't create an account, please ignore this email.</p>
                  <p>Women Safety & Security System &copy; ${new Date().getFullYear()}</p>
                </div>
              </div>
            `
          });
          console.log(`[EMAIL] ✅ Verification email sent via fallback SMTP to ${email}, id: ${info?.messageId}`);
          return { success: true };
        } catch (fallbackError) {
          console.error(`[EMAIL] Fallback SMTP also failed: ${fallbackError.message}`);
          console.log(`[EMAIL] Using final fallback: logging OTP to console`);
          
          // Final fallback: log OTP to console
          return logEmailOTP(email, name, otp);
        }
      }
    }
  } catch (error) {
    console.error(`[EMAIL] ❌ Verification email failed for ${email}:`, error.message);
    console.error(`[EMAIL] Error details:`, {
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack
    });
    
    // Provide more specific error messages
    if (error.code === 'ECONNECTION') {
      throw new Error('Failed to connect to email server. Please check your network connection and email configuration.');
    } else if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your email credentials.');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('Connection to email server timed out. Please try again later.');
    } else {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
};

module.exports = { sendSOSEmail, sendVerificationEmail };
