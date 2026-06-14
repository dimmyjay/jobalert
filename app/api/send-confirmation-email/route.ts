/**
 * API Route: Send Confirmation Email
 * POST /api/send-confirmation-email
 * 
 * Sends confirmation email after subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

interface PricingTier {
    frequency: 'hourly' | 'daily' | 'weekly';
    name: string;
    priceUSD: number;
    priceNGN: number;
}

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

function generateConfirmationTemplate(
    email: string,
    tier: PricingTier,
    subscriptionId: string,
    keywords: string[],
    locations: string[]
): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Confirmed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 16px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">✅ Subscription Confirmed!</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
            Welcome to Job Alerts
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 32px 16px;">
          <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px;">
            Hi ${email.split('@')[0]},
          </p>
          
          <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
            Thank you for subscribing! Your job alert subscription is now active and you'll start receiving ${tier.frequency} updates.
          </p>

          <!-- Plan Details -->
          <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 16px 0; color: #047857; font-size: 18px; font-weight: 600;">Your Plan: ${tier.name}</h2>
            <div style="color: #374151; font-size: 14px; line-height: 1.8;">
              <p style="margin: 8px 0;"><strong>Price:</strong> ₦${tier.priceNGN.toLocaleString()} (~$${tier.priceUSD} USD) per month</p>
              <p style="margin: 8px 0;"><strong>Frequency:</strong> ${tier.frequency.charAt(0).toUpperCase() + tier.frequency.slice(1)} alerts</p>
              <p style="margin: 8px 0;"><strong>Subscription ID:</strong> <code style="background: #e6f9f5; padding: 2px 6px; border-radius: 3px;">${subscriptionId}</code></p>
            </div>
          </div>

          <!-- Preferences Summary -->
          <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">Your Preferences</h3>
            <div style="color: #78350f; font-size: 14px;">
              <p style="margin: 8px 0;"><strong>Keywords:</strong> ${keywords.join(', ')}</p>
              <p style="margin: 8px 0;"><strong>Locations:</strong> ${locations.join(', ')}</p>
            </div>
          </div>

          <!-- What's Next -->
          <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600;">What's Next?</h3>
            <ol style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
              <li style="margin-bottom: 8px;">Your first job alert will be sent based on your frequency preference</li>
              <li style="margin-bottom: 8px;">Check your email for matching job opportunities</li>
              <li style="margin-bottom: 8px;">Click the job links to apply directly</li>
              <li>Manage your preferences anytime from your account dashboard</li>
            </ol>
          </div>

          <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">
            If you have any questions, feel free to <a href="mailto:support@jobalerts.com" style="color: #f59e0b; text-decoration: none;">contact our support team</a>.
          </p>
        </div>

        <!-- CTA -->
        <div style="text-align: center; padding: 24px 16px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
            View Your Account
          </a>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 16px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0 0 8px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" style="color: #f59e0b; text-decoration: none;">Manage Preferences</a> | 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #f59e0b; text-decoration: none;">Unsubscribe</a>
          </p>
          <p style="margin: 0;">© 2024 Job Alerts. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
    try {
        const { email, tier, subscriptionId, keywords, locations } = await request.json();

        if (!email || !tier || !subscriptionId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const htmlContent = generateConfirmationTemplate(
            email,
            tier,
            subscriptionId,
            keywords || [],
            locations || []
        );

        // Send email via Resend
        const result = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Job Alerts <onboarding@resend.dev>',
            to: email,
            subject: '✅ Your Job Alert Subscription is Confirmed!',
            html: htmlContent,
        });

        if (result.error) {
            throw new Error(`Resend API error: ${result.error.message}`);
        }

        console.log(`Confirmation email sent to ${email}, ID: ${result.data?.id}`);

        return NextResponse.json(
            { 
                message: 'Confirmation email sent successfully',
                emailId: result.data?.id,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return NextResponse.json(
            { 
                error: 'Failed to send confirmation email',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
