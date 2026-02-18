// Simple email service that logs OTPs for development/fallback
// In production, this would be replaced with a real email service

const logEmailOTP = (email, name, otp) => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    EMAIL VERIFICATION OTP                    ║
╠══════════════════════════════════════════════════════════════╣
║ Email: ${email.padEnd(50)} ║
║ Name:  ${name.padEnd(50)} ║
║ OTP:   ${otp.padEnd(50)} ║
║ Time:  ${new Date().toLocaleString().padEnd(46)} ║
╚══════════════════════════════════════════════════════════════╝

📧 NOTE: This is a fallback email service.
🔍 Please check your application logs for the OTP above.
⚠️  In production, configure a proper email service to send real emails.
  `);
  
  return { success: true, method: 'log', otp };
};

const logSOSEmail = (guardians, userName, userPhone, lat, lng) => {
  const guardianList = guardians.map(g => `• ${g.name} (${g.email})`).join('\n');
  
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                      🚨 SOS ALERT 🚨                        ║
╠══════════════════════════════════════════════════════════════╣
║ User:     ${userName.padEnd(44)} ║
║ Phone:    ${userPhone.padEnd(44)} ║
║ Location: ${lat.toFixed(4)}, ${lng.toFixed(4).padEnd(36)} ║
║ Time:     ${new Date().toLocaleString().padEnd(44)} ║
╠══════════════════════════════════════════════════════════════╣
║ Guardians Notified:                                            ║
${guardianList.padEnd(63)} ║
╚══════════════════════════════════════════════════════════════╝

📧 NOTE: This is a fallback email service.
🔍 Please check your application logs for SOS details.
⚠️  In production, configure a proper email service to send real alerts.
  `);
  
  return { success: true, method: 'log', guardiansNotified: guardians.length };
};

module.exports = { logEmailOTP, logSOSEmail };
