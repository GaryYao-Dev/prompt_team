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
   * Provides raw product info so LLM can write copy around it
   */
  private formatSimilarProducts(products: ProductInfo[]): string {
    if (!products || products.length === 0) {
      return 'No similar products available.'
    }

    return products
      .map((p, i) => {
        return `${i + 1}. ${p.name}
   - Description: ${p.description}
   - Original Price: ${p.originalPrice ? `$${p.originalPrice.toFixed(2)}` : 'N/A'}
   - Current Price: $${p.price.toFixed(2)}
   - Discount: ${p.discount || 'None'}
   - URL: ${p.productUrl}
   - Image: ${p.imageUrl}`
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
    feedback?: string,
    previousDraft?: EmailDraft
  ): Promise<EmailDraft> {
    const feedbackSection =
      feedback && previousDraft
        ? `\n\n[PREVIOUS FAILED DRAFT]
\`\`\`json
${JSON.stringify(
  {
    subject: previousDraft.subject,
    content: previousDraft.content,
  },
  null,
  2
)}
\`\`\`

[REVISION FEEDBACK]
The above draft failed evaluation.
Feedback: "${feedback}"
CRITICAL: You must IMPROVE based on this feedback. Do not repeat the same mistakes.
STRICTLY follow the JSON format requirements defined below.`
        : feedback
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
3. Do NOT promote or link to the purchased product - it is for context only
4. Generate content that fits the JSON structure below
5. CRITICAL: For product prices, copy the exact values from the input data:
   - "price" is REQUIRED - use the Current Price from input
   - "originalPrice" is OPTIONAL - ONLY include if the product has a discount (Original Price > Current Price)
   - "discount" is OPTIONAL - ONLY include if the product has a discount percentage listed in the input
   - Do NOT invent discounts or original prices. If no discount exists in the input, OMIT these fields entirely.

Please output in JSON format:
\`\`\`json
{
  "subject": "Email subject line",
  "content": {
    "headline": "Main headline for the email",
    "introduction": "Engaging introduction paragraphs",
    "products": [
      {
        "name": "Product Name",
        "description": "Persuasive description for this product (2-3 sentences)",
        "imageUrl": "Product Image URL (copy exactly from input)",
        "productUrl": "Product URL (copy exactly from input)",
        "price": 29.89
      },
      {
        "name": "Discounted Product Name",
        "description": "Description for discounted product",
        "imageUrl": "URL",
        "productUrl": "URL",
        "price": 14.88,
        "originalPrice": 29.99,
        "discount": "50% OFF"
      }
    ],
    "outro": "Closing paragraph",
    "ctaText": "Shop Now",
    "ctaUrl": "https://www.modafitclub.com"
  }
}
\`\`\``
    )

    const response = await this.invoke([message])
    const parsed = this.parseResponse<{
      subject: string
      content: {
        headline: string
        introduction: string
        products: Array<{
          name: string
          description: string
          imageUrl: string
          productUrl: string
          price: number
          originalPrice?: number
          discount?: string
        }>
        outro: string
        ctaText: string
        ctaUrl: string
      }
    }>(
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content)
    )

    return {
      subject: parsed.subject,
      content: parsed.content,
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
