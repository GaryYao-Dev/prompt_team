/**
 * Email Sending Tool (Mock)
 * Simulates sending promotional emails
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'

export interface EmailSendResult {
  success: boolean
  sentCount: number
  failedEmails: string[]
  timestamp: string
  htmlPreview: string
}

/**
 * Mock email sending function
 * In production, integrate with email service (SendGrid, AWS SES, etc.)
 */
async function sendEmails(
  emails: string[],
  subject: string,
  htmlContent: string
): Promise<EmailSendResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Mock: randomly fail some emails for realism
  const failedEmails = emails.filter(() => Math.random() < 0.05)
  const sentCount = emails.length - failedEmails.length

  console.log(`[Mock Email] Sending to ${emails.length} recipients`)
  console.log(`[Mock Email] Subject: ${subject}`)
  console.log(`[Mock Email] Sent: ${sentCount}, Failed: ${failedEmails.length}`)

  return {
    success: failedEmails.length === 0,
    sentCount,
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
      'Send promotional HTML emails to a list of customer email addresses (mock)',
    schema: z.object({
      emails: z.array(z.string()).describe('List of recipient email addresses'),
      subject: z.string().describe('Email subject line'),
      htmlContent: z.string().describe('HTML content of the email'),
    }),
  }
)

// Export the pure function for direct use
export { sendEmails }
