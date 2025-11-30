# Email Setup Guide

This guide covers setting up email services for the DivorceLawyer.com application, including the claim profile process and other email notifications.

---

## 📧 Email Service Providers

### Recommended Options

#### 1. **Resend** (Recommended for Next.js)
- **Best for**: Modern Next.js applications, developer-friendly
- **Pricing**: Free tier (3,000 emails/month), then $20/month for 50,000 emails
- **Pros**: 
  - Excellent Next.js/React integration
  - Simple API
  - Great developer experience
  - Built-in email templates
  - Domain verification via DNS
- **Cons**: Newer service (but very reliable)
- **Website**: https://resend.com

#### 2. **SendGrid** (Twilio)
- **Best for**: High volume, enterprise needs
- **Pricing**: Free tier (100 emails/day), then $19.95/month for 50,000 emails
- **Pros**:
  - Very reliable and scalable
  - Excellent deliverability
  - Advanced analytics
  - Email templates
  - Webhooks for tracking
- **Cons**: More complex setup, enterprise-focused
- **Website**: https://sendgrid.com

#### 3. **AWS SES** (Amazon Simple Email Service)
- **Best for**: Cost-effective, high volume
- **Pricing**: $0.10 per 1,000 emails (very cheap)
- **Pros**:
  - Extremely cost-effective
  - Highly scalable
  - Integrates with other AWS services
  - Good deliverability
- **Cons**: More technical setup, requires AWS account
- **Website**: https://aws.amazon.com/ses/

#### 4. **Mailgun**
- **Best for**: Transactional emails, developer-friendly
- **Pricing**: Free tier (5,000 emails/month for 3 months), then $35/month
- **Pros**:
  - Great for transactional emails
  - Good API documentation
  - Email validation API included
  - Webhooks and analytics
- **Cons**: Pricing can get expensive at scale
- **Website**: https://www.mailgun.com

#### 5. **Postmark**
- **Best for**: Transactional emails only
- **Pricing**: Free tier (100 emails/month), then $15/month for 10,000 emails
- **Pros**:
  - Excellent deliverability
  - Simple API
  - Great for transactional emails
  - Detailed bounce/spam tracking
- **Cons**: Only for transactional (not marketing)
- **Website**: https://postmarkapp.com

---

## 🚀 Setup Instructions

### Option 1: Resend (Recommended)

#### Step 1: Create Resend Account
1. Go to https://resend.com
2. Sign up for a free account
3. Verify your email address

#### Step 2: Get API Key
1. Go to **API Keys** in the dashboard
2. Click **Create API Key**
3. Name it (e.g., "DivorceLawyer Production")
4. Copy the API key (starts with `re_`)

#### Step 3: Verify Your Domain (Optional but Recommended)
1. Go to **Domains** in the dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `divorcelawyer.com`)
4. Add the DNS records provided to your domain registrar
5. Wait for verification (usually a few minutes)

#### Step 4: Configure Environment Variables
Add to your `.env.local` (for development) and Vercel environment variables:

```bash
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL_ADDRESS=noreply@divorcelawyer.com
# Or use Resend's default: onboarding@resend.dev (for testing)
```

#### Step 5: Update Email Utility
The email utility (`lib/email.ts`) is already set up for Resend. Just add your API key!

#### Step 6: Test
1. Run the claim profile process
2. Check your email inbox
3. Verify the email was received

---

### Option 2: SendGrid

#### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up for a free account
3. Verify your email and complete setup

#### Step 2: Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it (e.g., "DivorceLawyer API")
4. Select **Full Access** or **Restricted Access** (with Mail Send permissions)
5. Copy the API key (you won't see it again!)

#### Step 3: Verify Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Choose **Single Sender Verification** (for testing) or **Domain Authentication** (for production)
3. Follow the verification steps

#### Step 4: Install SendGrid Package
```bash
npm install @sendgrid/mail
```

#### Step 5: Update Email Utility
Update `lib/email.ts`:

```typescript
import sgMail from '@sendgrid/mail'

const sendgridApiKey = process.env.SENDGRID_API_KEY

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey)
}

export async function sendClaimProfileEmail(
  to: string,
  lawyerName: string,
  verificationLink: string
): Promise<EmailResult> {
  const fromEmail = process.env.FROM_EMAIL_ADDRESS || 'noreply@divorcelawyer.com'
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'DivorceLawyer.com'

  const msg = {
    to,
    from: fromEmail,
    subject: `Claim Your Profile on ${siteName}`,
    html: `
      <p>Dear ${lawyerName},</p>
      <p>You recently requested to claim your profile on ${siteName}.</p>
      <p>Please click the link below to verify your email and set up your password:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
      <p>This link is valid for 24 hours.</p>
      <p>If you did not request this, please ignore this email.</p>
      <p>Best regards,</p>
      <p>The ${siteName} Team</p>
    `,
  }

  if (process.env.NODE_ENV === 'development' && !sendgridApiKey) {
    console.log('\n--- SIMULATED EMAIL SEND ---')
    console.log('To:', to)
    console.log('From:', fromEmail)
    console.log('Subject:', msg.subject)
    console.log('Content:', msg.html)
    console.log('----------------------------\n')
    return { success: true }
  }

  try {
    await sgMail.send(msg)
    return { success: true }
  } catch (error: any) {
    console.error('SendGrid error:', error)
    return { success: false, error: error.message }
  }
}
```

#### Step 6: Configure Environment Variables
```bash
SENDGRID_API_KEY=SG.your_api_key_here
FROM_EMAIL_ADDRESS=noreply@divorcelawyer.com
```

---

### Option 3: AWS SES

#### Step 1: Create AWS Account
1. Go to https://aws.amazon.com
2. Create an account (if you don't have one)
3. Navigate to **Simple Email Service (SES)**

#### Step 2: Verify Email Address (Sandbox Mode)
1. Go to **Verified identities**
2. Click **Create identity**
3. Choose **Email address**
4. Enter your email and verify it

#### Step 3: Request Production Access (Required for Production)
1. Go to **Account dashboard**
2. Click **Request production access**
3. Fill out the form explaining your use case
4. Wait for approval (usually 24-48 hours)

#### Step 4: Create IAM User with SES Permissions
1. Go to **IAM** → **Users**
2. Click **Create user**
3. Attach policy: `AmazonSESFullAccess` (or create custom policy)
4. Create access key
5. Save the access key ID and secret

#### Step 5: Install AWS SDK
```bash
npm install @aws-sdk/client-ses
```

#### Step 6: Update Email Utility
Update `lib/email.ts`:

```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const sesClient = process.env.AWS_SES_REGION ? new SESClient({
  region: process.env.AWS_SES_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
}) : null

export async function sendClaimProfileEmail(
  to: string,
  lawyerName: string,
  verificationLink: string
): Promise<EmailResult> {
  const fromEmail = process.env.FROM_EMAIL_ADDRESS || 'noreply@divorcelawyer.com'
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'DivorceLawyer.com'

  const params = {
    Source: fromEmail,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: `Claim Your Profile on ${siteName}` },
      Body: {
        Html: {
          Data: `
            <p>Dear ${lawyerName},</p>
            <p>You recently requested to claim your profile on ${siteName}.</p>
            <p>Please click the link below to verify your email and set up your password:</p>
            <p><a href="${verificationLink}">${verificationLink}</a></p>
            <p>This link is valid for 24 hours.</p>
            <p>If you did not request this, please ignore this email.</p>
            <p>Best regards,</p>
            <p>The ${siteName} Team</p>
          `,
        },
      },
    },
  }

  if (process.env.NODE_ENV === 'development' && !sesClient) {
    console.log('\n--- SIMULATED EMAIL SEND ---')
    console.log('To:', to)
    console.log('From:', fromEmail)
    console.log('Subject:', params.Message.Subject.Data)
    console.log('Content:', params.Message.Body.Html.Data)
    console.log('----------------------------\n')
    return { success: true }
  }

  try {
    const command = new SendEmailCommand(params)
    await sesClient!.send(command)
    return { success: true }
  } catch (error: any) {
    console.error('AWS SES error:', error)
    return { success: false, error: error.message }
  }
}
```

#### Step 7: Configure Environment Variables
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_REGION=us-east-1
FROM_EMAIL_ADDRESS=noreply@divorcelawyer.com
```

---

## 📝 Current Email Implementation

The current email system is located in `lib/email.ts` and is already configured for Resend. It includes:

- **Development mode**: Logs emails to console (no actual sending)
- **Production mode**: Sends emails via configured service
- **Error handling**: Graceful fallbacks

### Current Functions

1. **`sendClaimProfileEmail()`** - Sends verification email for claim profile process

### Future Email Functions to Add

Consider adding these email functions:

1. **Password Reset Email** - For forgot password functionality
2. **Welcome Email** - After successful profile claim
3. **Profile Update Notification** - When lawyer updates their profile
4. **Contact Form Submission** - Confirmation to user
5. **Admin Notifications** - New lawyer registrations, etc.

---

## 🔒 Security Best Practices

1. **Never commit API keys** - Always use environment variables
2. **Use verified domains** - Improves deliverability and security
3. **Rate limiting** - Implement rate limiting for email endpoints
4. **Email validation** - Validate email addresses before sending
5. **SPF/DKIM/DMARC** - Set up email authentication records
6. **Bounce handling** - Monitor and handle bounced emails
7. **Unsubscribe** - Include unsubscribe links for marketing emails

---

## 🧪 Testing

### Development Testing
- Emails are logged to console in development mode
- No actual emails are sent (saves costs and prevents spam)

### Production Testing
1. Use a test email address first
2. Check spam folder
3. Verify links work correctly
4. Test on different email providers (Gmail, Outlook, etc.)

---

## 📊 Monitoring & Analytics

### Recommended Metrics to Track
- **Delivery rate** - Percentage of emails delivered
- **Open rate** - Percentage of emails opened
- **Click rate** - Percentage of links clicked
- **Bounce rate** - Percentage of bounced emails
- **Spam complaints** - Monitor spam reports

### Tools
- Most email providers include analytics dashboards
- Consider integrating webhooks for real-time tracking
- Set up alerts for high bounce rates or delivery failures

---

## 🚨 Troubleshooting

### Emails Not Sending
1. Check API key is correct
2. Verify environment variables are set
3. Check email service dashboard for errors
4. Verify sender email is authenticated
5. Check spam folder

### High Bounce Rate
1. Verify email addresses before sending
2. Clean up invalid email addresses
3. Use double opt-in for subscriptions
4. Monitor bounce reports

### Emails Going to Spam
1. Set up SPF, DKIM, and DMARC records
2. Use verified sender domain
3. Avoid spam trigger words
4. Maintain good sender reputation
5. Include unsubscribe links

---

## 📚 Additional Resources

- **Resend Docs**: https://resend.com/docs
- **SendGrid Docs**: https://docs.sendgrid.com
- **AWS SES Docs**: https://docs.aws.amazon.com/ses
- **Email Best Practices**: https://www.campaignmonitor.com/resources/guides/email-marketing-best-practices/

---

## ✅ Next Steps Checklist

- [ ] Choose email service provider
- [ ] Create account and get API key
- [ ] Verify sender domain/email
- [ ] Add API key to environment variables
- [ ] Update `lib/email.ts` if using different provider
- [ ] Test email sending in development
- [ ] Test email sending in production
- [ ] Set up email monitoring/alerts
- [ ] Configure SPF/DKIM/DMARC records
- [ ] Document any custom email templates
- [ ] Set up bounce handling
- [ ] Plan for future email types (password reset, welcome, etc.)

---

**Last Updated**: December 2024
**Maintained By**: Development Team



