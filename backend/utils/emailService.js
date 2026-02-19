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
    <div style="font-family: Arial; padding:20px;">
      <h2>Women Safety System</h2>
      <p>Hello ${name},</p>
      <p>Your verification OTP is:</p>
      <h1 style="color:red;">${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
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
