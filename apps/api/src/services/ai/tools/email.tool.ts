/**
 * Email Sending Tool
 * Uses Resend SDK for email delivery
 * Sends HTML-only emails to ensure proper rendering
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { Resend } from 'resend'
import { RESEND_API_KEY, EMAIL_FROM } from '@/config/env'

export interface EmailSendResult {
  success: boolean
  sentCount: number
  failedEmails: string[]
  timestamp: string
  htmlPreview: string
  providerResponses?: Array<{ email: string; id?: string; error?: string }>
}

// Initialize Resend client
const resend = new Resend(RESEND_API_KEY)

/**
 * Validate Resend API configuration
 */
function validateResendConfig(): void {
  if (!RESEND_API_KEY) {
    throw new Error(
      'Resend API key not configured. Set RESEND_API_KEY environment variable.'
    )
  }
}

// Batch size limit for Resend API
const BATCH_SIZE = 100

/**
 * Send promotional emails using Resend SDK Batch API
 * Each recipient only sees themselves - emails are sent individually
 * Supports up to 100 emails per batch request
 */
async function sendEmails(
  emails: string[],
  subject: string,
  htmlContent: string
): Promise<EmailSendResult> {
  const sentEmails: string[] = []
  const failedEmails: string[] = []
  const providerResponses: Array<{
    email: string
    id?: string
    error?: string
  }> = []

  console.log(
    `[Email] Sending to ${emails.length} recipients via Resend Batch API...`
  )
  console.log(`[Email] Subject: ${subject}`)

  try {
    validateResendConfig()

    // Split emails into batches of BATCH_SIZE
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE)
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(emails.length / BATCH_SIZE)

      console.log(
        `[Email] Sending batch ${batchNumber}/${totalBatches} (${batch.length} emails)...`
      )

      // Create individual email objects for each recipient
      const emailPayloads = batch.map((email) => ({
        from: EMAIL_FROM,
        to: [email],
        subject: subject,
        html: htmlContent,
      }))

      try {
        const { data, error } = await resend.batch.send(emailPayloads)

        if (error) {
          // Batch-level error - all emails in this batch failed
          console.error(`[Email] Batch ${batchNumber} failed: ${error.message}`)
          for (const email of batch) {
            providerResponses.push({ email, error: error.message })
            failedEmails.push(email)
          }
        } else if (data) {
          // Process individual results from batch response
          data.data.forEach((result, index) => {
            const email = batch[index]
            if (result.id) {
              console.log(`[Email] Sent to ${email}: ${result.id}`)
              providerResponses.push({ email, id: result.id })
              sentEmails.push(email)
            } else {
              console.error(
                `[Email] Failed to send to ${email}: No ID returned`
              )
              providerResponses.push({ email, error: 'No ID returned' })
              failedEmails.push(email)
            }
          })
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        console.error(`[Email] Batch ${batchNumber} error: ${errorMessage}`)
        for (const email of batch) {
          providerResponses.push({ email, error: errorMessage })
          failedEmails.push(email)
        }
      }
    }
  } catch (error) {
    // If validation or config failed, all emails fail
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Email] Resend API error: ${errorMessage}`)
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
    providerResponses,
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
