/**
 * Manager Agent
 * Responsibilities: Define strategy + Final approval (no content re-evaluation)
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { BaseMessage } from '@langchain/core/messages'
import { HumanMessage } from '@langchain/core/messages'
import { BaseAgent } from './base.agent'
import type { ProductInfo, PromotionStrategy } from './types'
import { MANAGER_STRATEGY_PROMPT } from '../prompts'

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
}
