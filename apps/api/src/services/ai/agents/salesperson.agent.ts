/**
 * Salesperson Agent
 * Responsibility: Write promotional email in assigned style
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { HumanMessage } from '@langchain/core/messages'
import { BaseAgent } from './base.agent'
import type {
  EmailDraft,
  ProductInfo,
  PromotionStrategy,
  SalespersonConfig,
} from './types'
import { SalespersonStyle } from './types'
import {
  SALESPERSON_RATIONAL_PROMPT,
  SALESPERSON_EMOTIONAL_PROMPT,
} from '../prompts'

/**
 * Salesperson agent writes promotional emails in a specific style.
 * Two instances are typically used: Rational and Emotional styles.
 */
export class SalespersonAgent extends BaseAgent {
  private readonly style: SalespersonStyle
  private readonly salespersonId: string

  constructor(llm: BaseChatModel, config: SalespersonConfig) {
    const systemPrompt =
      config.style === SalespersonStyle.RATIONAL
        ? SALESPERSON_RATIONAL_PROMPT
        : SALESPERSON_EMOTIONAL_PROMPT

    super(llm, {
      ...config,
      systemPrompt,
    })

    this.style = config.style
    this.salespersonId = config.salespersonId
  }

  /**
   * Format similar products for the prompt
   * Generates the exact price line so LLM doesn't need to compose it
   */
  private formatSimilarProducts(products: ProductInfo[]): string {
    if (!products || products.length === 0) {
      return 'No similar products available.'
    }

    return products
      .map((p, i) => {
        // Generate the exact price line with Markdown formatting
        let priceLine: string
        if (p.originalPrice && p.discount) {
          // Has original price and discount
          priceLine = `~~$${p.originalPrice.toFixed(2)}~~ **$${p.price.toFixed(2)}** **${p.discount}** [Shop Now](${p.productUrl})`
        } else if (p.originalPrice) {
          // Has original price but no discount label
          priceLine = `~~$${p.originalPrice.toFixed(2)}~~ **$${p.price.toFixed(2)}** [Shop Now](${p.productUrl})`
        } else {
          // No discount info
          priceLine = `**$${p.price.toFixed(2)}** [Shop Now](${p.productUrl})`
        }

        return `${i + 1}. ${p.name}
   - Description: ${p.description}
   - Image URL: ${p.imageUrl}
   - PRICE LINE (COPY EXACTLY): ${priceLine}`
      })
      .join('\n\n')
  }

  /**
   * Write a promotional email based on product, strategy, and similar products
   */
  async writeEmail(
    product: ProductInfo,
    strategy: PromotionStrategy,
    similarProducts: ProductInfo[],
    feedback?: string
  ): Promise<EmailDraft> {
    const feedbackSection = feedback
      ? `\n\n[REVISION FEEDBACK]\n${feedback}\nPlease optimize the email content based on the above feedback.`
      : ''

    const similarProductsSection = this.formatSimilarProducts(similarProducts)

    const message = new HumanMessage(
      `Please write a promotional email for a customer who purchased the following product. 
The goal is to recommend similar products they might like.

[PURCHASED PRODUCT - for context only]
- Name: ${product.name}
- Category: ${product.category}
- Description: ${product.description}

[SIMILAR PRODUCTS TO RECOMMEND - include ALL of these in the email]
${similarProductsSection}

[STRATEGY REQUIREMENTS]
- Target Audience: ${strategy.targetAudience}
- Key Selling Points: ${strategy.keySellingPoints.join(', ')}
- Overall Tone: ${strategy.tone}
- Call to Action: ${strategy.callToAction}
${strategy.urgencyMessage ? `- Urgency Message: ${strategy.urgencyMessage}` : ''}
${feedbackSection}

IMPORTANT REQUIREMENTS:
1. Write all content in English
2. Include ALL ${similarProducts.length} recommended products in the email
3. For each product, use this EXACT format:
   - Product name as heading (### Product Name)
   - Brief description (2-3 sentences)
   - Product image: ![Product Name](Image URL from product data)
   - COPY THE PRICE LINE EXACTLY as provided in the product data (do NOT modify prices)
4. Keep the layout clean and scannable
5. CRITICAL: Use the exact prices provided - DO NOT shorten or round them

Please output in JSON format:
\`\`\`json
{
  "subject": "Email subject line",
  "bodyMarkdown": "Email body content (in Markdown format with product images and links)"
}
\`\`\``
    )

    const response = await this.invoke([message])
    const parsed = this.parseResponse<{
      subject: string
      bodyMarkdown: string
    }>(
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content)
    )

    return {
      ...parsed,
      style: this.style,
      salespersonId: this.salespersonId,
    }
  }

  getStyle(): SalespersonStyle {
    return this.style
  }

  getSalespersonId(): string {
    return this.salespersonId
  }
}
