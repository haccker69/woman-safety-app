# Email Configuration for Production Deployment

## Issue
Email verification works on localhost but fails on deployed site with "connection timeout" errors.

## Root Cause
Production environments often have network restrictions that prevent direct SMTP connections to Gmail/other email services.

## Solutions

### Option 1: Use Email Service API (Recommended)
Instead of direct SMTP, use a dedicated email service:

#### Resend with Gmail (Easiest - No Domain Required)
```bash
# Environment Variables
NODE_ENV=production
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=wommansafety@gmail.com
EMAIL_USER=wommansafety@gmail.com
```

#### Resend with Custom Domain (Optional)
```bash
# Environment Variables
NODE_ENV=production
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
For production reliability, use **Enhanced SMTP Configuration**:

### Step 1: Use Gmail App Password
1. Enable 2-factor authentication on your Gmail
2. Go to Google Account settings → Security → App Passwords
3. Generate a new app password for "Mail"
4. Use this 16-character password (not your regular password)

### Step 2: Set Production Environment Variables
Add these to your deployment platform:
```bash
NODE_ENV=production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=wommansafety@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
```

### Step 3: Alternative Email Services (if Gmail still fails)
If Gmail doesn't work in production, try these alternatives:

#### SendGrid (Free tier available)
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your_sendgrid_api_key
```

#### Mailgun (Free tier available)
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your_domain.mailgun.org
EMAIL_PASSWORD=your_mailgun_password
```

### Step 4: Deploy
1. Push updated code to GitHub
2. Deploy with new environment variables
3. Test email verification on deployed site

### Enhanced SMTP Features
- ✅ Extended timeouts (2 minutes)
- ✅ Connection pooling for reliability
- ✅ Rate limiting to prevent blocking
- ✅ TLS configuration for security
- ✅ Debug logging for troubleshooting

This should resolve connection timeout issues in production!
