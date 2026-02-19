const axios = require("axios");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || "wommansafety@gmail.com";

// Common function to send email via Brevo API
const sendEmailViaBrevo = async (to, subject, htmlContent) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Women Safety System",
          email: FROM_EMAIL,
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log(`[EMAIL] ✅ Email sent via Brevo API to ${to}, messageId: ${response.data?.messageId}`);
    return { success: true, messageId: response.data?.messageId };
  } catch (error) {
    console.error(
      "[EMAIL] ❌ Brevo API error:",
      error.response?.data || error.message
    );
    
    // Check for specific error types
    if (error.response?.status === 401) {
      console.log("[EMAIL] ⚠️ Invalid API key - please check your BREVO_API_KEY");
    } else if (error.response?.status === 403) {
      console.log("[EMAIL] ⚠️ Account not activated - contact Brevo support");
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log("[EMAIL] ⚠️ Network connection issue - will retry");
    }
    
    throw new Error(`Brevo API failed: ${error.response?.data?.message || error.message}`);
  }
};



// =========================
// Verification Email (OTP)
// =========================
const sendVerificationEmail = async (email, name, otp) => {
  console.log(`[EMAIL] Sending OTP to ${email}`);

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

  return await sendEmailViaBrevo(
    email,
    "Email Verification - Women Safety",
    htmlContent
  );
};



// =========================
// SOS Email
// =========================
const sendSOSEmail = async (guardians, userName, userPhone, lat, lng) => {
  const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;

  const htmlContent = `
    <div style="font-family: Arial; padding:20px; border:2px solid red;">
      <h2 style="color:red;">🚨 EMERGENCY SOS ALERT</h2>
      <p><strong>${userName}</strong> has triggered an SOS.</p>
      <p><strong>Phone:</strong> ${userPhone}</p>
      <p><strong>Location:</strong></p>
      <a href="${mapLink}">View on Google Maps</a>
    </div>
  `;

  const promises = guardians.map((g) =>
    sendEmailViaBrevo(
      g.email,
      "🚨 SOS Alert - Women Safety",
      htmlContent
    )
  );

  await Promise.all(promises);

  console.log(`[EMAIL] SOS sent to ${guardians.length} guardians`);
  return { success: true };
};

module.exports = {
  sendVerificationEmail,
  sendSOSEmail,
};
