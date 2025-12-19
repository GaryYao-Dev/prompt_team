/**
 * Email Sending Tool
 * Uses Nodemailer for real SMTP email delivery
 * Sends HTML-only emails to ensure proper rendering in Gmail
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
} from '@/config/env'

export interface EmailSendResult {
  success: boolean
  sentCount: number
  failedEmails: string[]
  timestamp: string
  htmlPreview: string
}

// Lazy-initialized transporter (created on first use)
let transporter: Transporter | null = null

/**
 * Get or create the nodemailer transporter
 * Validates SMTP configuration before creating
 */
function getTransporter(): Transporter {
  if (transporter) {
    return transporter
  }

  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables.'
    )
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })

  console.log(`[Email] Transporter created for ${SMTP_HOST}:${SMTP_PORT}`)
  return transporter
}

/**
 * Send promotional emails using Nodemailer
 * Sends HTML-only emails (no multipart/alternative) for best Gmail compatibility
 */
async function sendEmails(
  emails: string[],
  subject: string,
  htmlContent: string
): Promise<EmailSendResult> {
  const sentEmails: string[] = []
  const failedEmails: string[] = []

  console.log(`[Email] Sending to ${emails.length} recipients...`)
  console.log(`[Email] Subject: ${subject}`)

  try {
    const transport = getTransporter()

    for (const email of emails) {
      try {
        const info = await transport.sendMail({
          from: EMAIL_FROM,
          to: email,
          subject: subject,
          html: htmlContent, // HTML only - no text version to avoid multipart/alternative issues
        })

        console.log(`[Email] Sent to ${email}: ${info.messageId}`)
        sentEmails.push(email)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        console.error(`[Email] Failed to send to ${email}: ${errorMessage}`)
        failedEmails.push(email)
      }
    }
  } catch (error) {
    // If transporter creation failed, all emails fail
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Email] Transporter error: ${errorMessage}`)
    return {
      success: false,
      sentCount: 0,
      failedEmails: emails,
      timestamp: new Date().toISOString(),
      htmlPreview: `Error: ${errorMessage}`,
    }
  }

  const success = failedEmails.length === 0

  console.log(
    `[Email] Complete: ${sentEmails.length} sent, ${failedEmails.length} failed`
  )

  return {
    success,
    sentCount: sentEmails.length,
    failedEmails,
    timestamp: new Date().toISOString(),
    htmlPreview: htmlContent.substring(0, 500) + '...',
  }
}

/**
 * Email sending tool for LangGraph
 */
export const sendEmailTool = tool(
  async ({ emails, subject, htmlContent }) => {
    const result = await sendEmails(emails, subject, htmlContent)
    return JSON.stringify(result, null, 2)
  },
  {
    name: 'send_promotion_email',
    description:
      'Send promotional HTML emails to a list of customer email addresses via SMTP',
    schema: z.object({
      emails: z.array(z.string()).describe('List of recipient email addresses'),
      subject: z.string().describe('Email subject line'),
      htmlContent: z.string().describe('HTML content of the email'),
    }),
  }
)

// Export the pure function for direct use
export { sendEmails }
