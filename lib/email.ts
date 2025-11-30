/**
 * Email utility for sending emails
 * 
 * This is a placeholder for email functionality.
 * In production, integrate with an email service like:
 * - Resend (recommended): https://resend.com
 * - SendGrid: https://sendgrid.com
 * - AWS SES: https://aws.amazon.com/ses/
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  // In development, log the email instead of sending
  if (process.env.NODE_ENV === 'development') {
    console.log('=== EMAIL (Development Mode) ===')
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('Body:', options.html)
    console.log('===============================')
    return { success: true }
  }

  // TODO: Integrate with email service
  // Example with Resend:
  /*
  import { Resend } from 'resend'
  
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'DivorceLawyer.com <noreply@divorcelawyer.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
  */

  // For now, return success (emails logged in development)
  return { success: true }
}

/**
 * Send claim profile verification email
 */
export async function sendClaimProfileEmail(
  email: string,
  lawyerName: string,
  verificationLink: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #163B46; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">DivorceLawyer.com</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #163B46;">Claim Your Lawyer Profile</h2>
          
          <p>Hello ${lawyerName},</p>
          
          <p>We received a request to claim your lawyer profile on DivorceLawyer.com. If this was you, please click the button below to verify your email and complete the claim process.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #FC9445; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Claim My Profile
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 12px; word-break: break-all;">${verificationLink}</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't request this, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            If you have any questions, please contact us at support@divorcelawyer.com
          </p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">© ${new Date().getFullYear()} DivorceLawyer.com. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  const text = `
Claim Your Lawyer Profile

Hello ${lawyerName},

We received a request to claim your lawyer profile on DivorceLawyer.com. If this was you, please click the link below to verify your email and complete the claim process.

${verificationLink}

This link will expire in 24 hours. If you didn't request this, please ignore this email.

If you have any questions, please contact us at support@divorcelawyer.com
  `.trim()

  return sendEmail({
    to: email,
    subject: 'Claim Your Lawyer Profile - DivorceLawyer.com',
    html,
    text,
  })
}

