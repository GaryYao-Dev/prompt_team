/**
 * Evaluator Agent
 * Responsibility: Evaluate and select the best email draft, provide optimization feedback
 * Can generate HTML from markdown and fix HTML issues using tools
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { HumanMessage } from '@langchain/core/messages'
import { BaseAgent } from './base.agent'
import type {
  EmailDraft,
  EvaluationResult,
  ProductInfo,
  DraftEvaluation,
} from './types'
import { EVALUATOR_PROMPT } from '../prompts'
import {
  convertMarkdownToHtml,
  createEmailTemplate,
} from '../tools/email-template.tool'

/**
 * Evaluation criteria with weights
 */
export const EVALUATION_CRITERIA = {
  attractiveness: {
    weight: 0.3,
    description: 'Does the title and opening attract clicks?',
  },
  valueDelivery: {
    weight: 0.25,
    description: 'Are product advantages clearly communicated?',
  },
  urgency: { weight: 0.2, description: 'Does it drive users to take action?' },
  ctaClarity: { weight: 0.15, description: 'Is the call-to-action clear?' },
  brandConsistency: {
    weight: 0.1,
    description: 'Does it match the brand tone?',
  },
} as const

const PASSING_SCORE = 70

/**
 * Evaluator agent assesses email drafts and selects the best one.
 * Evaluates EACH draft individually to enable selective regeneration.
 * Can also generate and fix HTML using tools.
 */
export class EvaluatorAgent extends BaseAgent {
  constructor(llm: BaseChatModel) {
    super(llm, {
      role: 'evaluator',
      systemPrompt: EVALUATOR_PROMPT,
    })
  }

  /**
   * Generate HTML from the selected draft
   * Uses the template rendering tool
   */
  async generateHtml(draft: EmailDraft, product: ProductInfo): Promise<string> {
    console.log('[Evaluator] Generating HTML from draft using template...')

    // Check if we have structured content (new flow) or markdown (legacy)
    if (draft.content) {
      // Use helper to keep logic clean, direct import of renderEmailTemplate
      const { renderEmailTemplate } = require('../tools/email-template.tool')
      const fullHtml = renderEmailTemplate(draft.content)
      console.log(
        '[Evaluator] HTML generated from template, length:',
        fullHtml.length
      )
      return fullHtml
    }

    // Fallback for legacy Markdown
    console.log('[Evaluator] Fallback: Generating HTML from Markdown...')
    const {
      convertMarkdownToHtml,
      createEmailTemplate,
    } = require('../tools/email-template.tool')
    const bodyHtml = convertMarkdownToHtml(draft.bodyMarkdown || '')
    const fullHtml = createEmailTemplate(
      draft.subject,
      bodyHtml,
      product.productUrl,
      'Shop Now'
    )
    return fullHtml
  }

  /**
   * Fix HTML issues based on manager feedback
   * Uses LLM to understand and fix the issues
   */
  async fixHtml(
    html: string,
    feedback: string,
    product: ProductInfo
  ): Promise<string> {
    console.log('[Evaluator] Fixing HTML based on feedback...')

    const message = new HumanMessage(
      `You are a skilled HTML developer. Please fix the following HTML email based on the feedback.

[MANAGER FEEDBACK]
${feedback}

[CURRENT HTML]
${html}

[PRODUCT INFO]
- Name: ${product.name}
- URL: ${product.productUrl}

[IMPORTANT RULES]
1. The email should ONLY promote similar/recommended products, NOT the purchased product (${product.name})
2. Remove any promotion of the purchased product (price, CTA, etc.)
3. Fix any HTML structure issues (unmatched tags, invalid nesting)
4. Keep all product links, images, and prices for the RECOMMENDED products
5. The Unsubscribe link should use href="https://www.modafitclub.com/unsubscribe"

Please return ONLY the fixed HTML, no explanation.`
    )

    const response = await this.invoke([message])
    const fixedHtml =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content)

    // Clean up any markdown code block wrapping
    const htmlMatch = fixedHtml.match(/```(?:html)?\s*([\s\S]*?)```/)
    const cleanedHtml = htmlMatch ? htmlMatch[1].trim() : fixedHtml.trim()

    console.log('[Evaluator] HTML fixed, length:', cleanedHtml.length)
    return cleanedHtml
  }

  /**
   * Evaluate multiple email drafts individually and select the best one
   * Returns per-draft evaluations to enable selective regeneration
   */
  async evaluate(
    drafts: EmailDraft[],
    product: ProductInfo
  ): Promise<EvaluationResult> {
    const draftsDescription = drafts
      .map((draft, index) => {
        let contentDisplay = ''
        if (draft.content) {
          contentDisplay = `
Headline: ${draft.content.headline}
Intro: ${draft.content.introduction}
Products: ${draft.content.products.map((p) => `[${p.name} - $${p.price}]`).join(', ')}
Outro: ${draft.content.outro}
             `
        } else {
          contentDisplay = draft.bodyMarkdown || ''
        }

        return `
[EMAIL ${index + 1}] (${draft.style} style - ${draft.salespersonId})
Subject: ${draft.subject}
Content:
${contentDisplay}
`
      })
      .join('\n---\n')

    const criteriaDescription = Object.entries(EVALUATION_CRITERIA)
      .map(
        ([key, value]) =>
          `- ${key} (${value.weight * 100}%): ${value.description}`
      )
      .join('\n')

    const message = new HumanMessage(
      `Please evaluate EACH email draft INDIVIDUALLY using the criteria below.
Each draft should receive its own score and pass/fail determination (score >= ${PASSING_SCORE} passes).

[PRODUCT INFORMATION]
- Name: ${product.name}
- Purchase Link: ${product.productUrl}

[EVALUATION CRITERIA]
${criteriaDescription}

[EMAILS TO EVALUATE]
${draftsDescription}

Please output the evaluation result in JSON format:
\`\`\`json
{
  "draftEvaluations": [
    {
      "salespersonId": "salesperson-rational or salesperson-emotional",
      "approved": true/false,
      "score": 0-100,
      "feedback": "Specific feedback for this draft"
    }
  ],
  "selectedDraftIndex": 0 or 1,
  "overallFeedback": "General suggestions for improvement",
  "optimizedContent": {
    "subject": "Optimized subject (if the selected draft needs improvement)",
    "bodyMarkdown": "Optimized content (if the selected draft needs improvement)"
  }
}
\`\`\`

Notes:
- Score >= ${PASSING_SCORE} means the draft is approved
- BOTH drafts must be approved for overall approval
- If not approved, feedback must clearly indicate issues and improvement directions
- optimizedContent is optional - only provide if selected draft needs fine-tuning

IMPORTANT: All feedback and optimized content should be in English.`
    )

    const response = await this.invoke([message])
    const parsed = this.parseResponse<{
      draftEvaluations: Array<{
        salespersonId: string
        approved: boolean
        score: number
        feedback?: string
      }>
      selectedDraftIndex: number
      overallFeedback?: string
      optimizedContent?: { subject: string; bodyMarkdown: string }
    }>(
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content)
    )

    // Build per-draft evaluation results
    const draftEvaluations: DraftEvaluation[] = parsed.draftEvaluations.map(
      (evalResult) => ({
        salespersonId: evalResult.salespersonId,
        approved: evalResult.approved,
        score: evalResult.score,
        feedback: evalResult.feedback,
      })
    )

    // Overall approval = all drafts approved
    const allApproved = draftEvaluations.every((e) => e.approved)

    const selectedDraft = drafts[parsed.selectedDraftIndex] || drafts[0]

    // Always use the original draft with structured content intact
    // Do NOT use optimizedContent (legacy) as it causes fallback to broken Markdown rendering
    return {
      approved: allApproved,
      selectedDraft, // Keep structured content for proper HTML template rendering
      draftEvaluations,
      feedback: parsed.overallFeedback,
      issues: allApproved
        ? undefined
        : {
            contentIssues: draftEvaluations
              .filter((e) => !e.approved)
              .map(
                (e) =>
                  `${e.salespersonId}: ${e.feedback || 'Needs improvement'}`
              ),
          },
    }
  }
}
