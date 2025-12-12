/**
 * Manager Agent
 * Responsibilities: Define strategy + Final approval (no content re-evaluation)
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { BaseMessage } from '@langchain/core/messages'
import { HumanMessage } from '@langchain/core/messages'
import { BaseAgent } from './base.agent'
import type {
  ProductInfo,
  PromotionStrategy,
  ManagerReviewResult,
} from './types'
import { MANAGER_STRATEGY_PROMPT, MANAGER_REVIEW_PROMPT } from '../prompts'

/**
 * Manager agent handles two distinct phases:
 * 1. Strategy definition - at workflow start
 * 2. Final approval - after HTML conversion
 */
export class ManagerAgent extends BaseAgent {
  constructor(llm: BaseChatModel) {
    super(llm, {
      role: 'manager',
      systemPrompt: MANAGER_STRATEGY_PROMPT,
    })
  }

  /**
   * Phase 1: Define promotion strategy based on product info
   */
  async defineStrategy(product: ProductInfo): Promise<PromotionStrategy> {
    const message = new HumanMessage(
      `Please develop a promotional email strategy for the following product:

Product Name: ${product.name}
Product Description: ${product.description}
Current Price: $${product.price}
${product.originalPrice ? `Original Price: $${product.originalPrice}` : ''}
${product.discount ? `Discount: ${product.discount}` : ''}
${product.features?.length ? `Features: ${product.features.join(', ')}` : ''}
Purchase Link: ${product.productUrl}

Please output the strategy in JSON format:
\`\`\`json
{
  "targetAudience": "Target audience description",
  "keySellingPoints": ["Selling point 1", "Selling point 2", "Selling point 3"],
  "tone": "Overall email tone",
  "callToAction": "Call-to-action phrase",
  "urgencyMessage": "Urgency message (optional)"
}
\`\`\``
    )

    const response = await this.invoke([message])
    return this.parseResponse<PromotionStrategy>(
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content)
    )
  }

  /**
   * Format similar products for validation
   */
  private formatSimilarProductsForReview(products: ProductInfo[]): string {
    return products
      .map(
        (p, i) => `${i + 1}. ${p.name}
   - Price: $${p.price.toFixed(2)}
   - Original Price: ${p.originalPrice ? `$${p.originalPrice.toFixed(2)}` : 'N/A'}
   - Discount: ${p.discount || 'N/A'}
   - Link: ${p.productUrl}`
      )
      .join('\n')
  }

  /**
   * Phase 2: Final approval of the HTML email
   *
   * This email promotes similar products and may also promote the purchased product
   * with current discounts for repurchase opportunities.
   */
  async reviewFinalEmail(
    htmlContent: string,
    purchasedProduct: ProductInfo,
    similarProducts: ProductInfo[]
  ): Promise<ManagerReviewResult> {
    const similarProductsInfo =
      this.formatSimilarProductsForReview(similarProducts)

    const reviewMessages: BaseMessage[] = [
      new HumanMessage(
        `${MANAGER_REVIEW_PROMPT}

EMAIL CONTEXT:
This is a promotional email for a customer who recently purchased:
- Purchased Product: ${purchasedProduct.name}

The email may promote:
1. Similar products they might like
2. The same product with current discount (for repurchase)

Products to verify (these should be correctly displayed):
${similarProductsInfo}

Generated HTML Email Content:
\`\`\`html
${htmlContent}
\`\`\`

VALIDATION CHECKLIST:
1. Check all product prices are displayed correctly (e.g., $24.88 not $1 or $2)
2. Verify original prices have strikethrough styling when applicable
3. Verify discount badges are visible when products have discounts
4. Check all product links point to correct URLs
5. Verify no placeholder text like [Your Brand Name] remains
6. The main CTA at bottom should link to homepage, not specific product
7. No HTML artifacts or stray tags visible in content

Please output the review result in JSON format:
\`\`\`json
{
  "approved": true/false,
  "feedback": "Review comments (if any)",
  "requiresContentRevision": false,
  "requiresFormatRevision": false
}
\`\`\``
      ),
    ]

    const response = await this.invoke(reviewMessages)
    return this.parseResponse<ManagerReviewResult>(
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content)
    )
  }
}
