const nodemailer = require('nodemailer');

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const FROM_EMAIL = process.env.EMAIL_USER;

// Send SOS Email Alert
const sendSOSEmail = async (guardians, userName, userPhone, lat, lng) => {
  try {
    const transporter = getTransporter();
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
    console.log(`SOS emails sent to ${guardians.length} guardians`);
    return { success: true, message: `SOS alert sent to ${guardians.length} guardian(s)` };
  } catch (error) {
    console.error('[EMAIL] SOS email error:', error.message);
    throw new Error('Failed to send SOS email alerts');
  }
};

// Send Email Verification OTP
const sendVerificationEmail = async (email, name, otp) => {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
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
    console.log(`[EMAIL] Verification email sent to ${email}, id: ${info?.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Verification email failed:', error.message);
    throw error;
  }
};

module.exports = { sendSOSEmail, sendVerificationEmail };
