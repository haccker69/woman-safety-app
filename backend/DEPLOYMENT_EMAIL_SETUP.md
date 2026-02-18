# Email Configuration for Production Deployment

## Issue
Email verification works on localhost but fails on deployed site with "connection timeout" errors.

## Root Cause
Production environments often have network restrictions that prevent direct SMTP connections to Gmail/other email services.

## Solutions

### Option 1: Use Email Service API (Recommended)
Instead of direct SMTP, use a dedicated email service:

#### Resend (Easiest)
```bash
# Environment Variables
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=your_verified_domain@yourdomain.com
```

#### SendGrid
```bash
# Environment Variables
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=your_email@yourdomain.com
```

#### Mailgun
```bash
# Environment Variables
MAILGUN_API_KEY=your_api_key_here
MAILGUN_DOMAIN=your_domain.com
MAILGUN_FROM_EMAIL=noreply@your_domain.com
```

### Option 2: Configure Production SMTP
If you must use SMTP, update your production environment variables:

```bash
# For Gmail (may not work in all production environments)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Alternative: Use a transactional email service SMTP
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USER=resend
EMAIL_PASSWORD=your_resend_api_key
```

### Option 3: Use Environment-Specific Configuration
Update your deployment platform's environment variables:

#### Vercel
```bash
vercel env add EMAIL_HOST
vercel env add EMAIL_PORT
vercel env add EMAIL_USER
vercel env add EMAIL_PASSWORD
```

#### Heroku
```bash
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_USER=your_email@gmail.com
heroku config:set EMAIL_PASSWORD=your_app_password
```

#### AWS/EC2/DigitalOcean
Add to your server's environment file or deployment script.

## Testing in Production
1. Deploy the updated code
2. Check server logs for email configuration status
3. Test registration with a real email address
4. Monitor logs for connection errors

## Common Issues & Fixes

### "Connection Timeout"
- Use email service API instead of direct SMTP
- Check firewall settings
- Verify port accessibility

### "Authentication Failed"
- Use App Password for Gmail (not regular password)
- Enable 2-factor authentication
- Check API key validity

### "Email Not Received"
- Check spam/junk folders
- Verify sender domain is authenticated
- Check email service logs

## Recommended Solution
For production reliability, use **Resend API**:
1. Sign up at https://resend.com
2. Get API key
3. Set environment variables
4. Update emailService.js to use Resend (revert to previous version)

This provides better deliverability and avoids network restrictions.
