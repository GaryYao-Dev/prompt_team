/**
 * AI Promotion Team Service
 * Main entry point for the multi-agent promotional email system
 */

import { promotionTeamGraph, type PromotionTeamState } from './graph'
import type { ProductInfo } from './agents/types'

// Re-export types and modules
export * from './agents'
export * from './graph'
export * from './tools'
export * from './llm'

/**
 * Input for running the promotion team workflow
 */
export interface PromotionTeamInput {
  product: ProductInfo
  customerEmails: string[]
  similarProducts: ProductInfo[]
}

/**
 * Output from the promotion team workflow
 */
export interface PromotionTeamOutput {
  success: boolean
  htmlContent: string | null
  sentCount: number
  selectedStyle?: string
  iterations: number
}

/**
 * Run the promotion team workflow to generate and send promotional emails
 *
 * @param input Product information, similar products, and customer email list
 * @returns Workflow result including HTML content and send statistics
 *
 * @example
 * ```typescript
 * const result = await runPromotionTeam({
 *   product: { id: 'APE-tshirt-2', name: '...', ... },
 *   customerEmails: ['user1@example.com'],
 *   similarProducts: [{ id: 'APE-tshirt-3', ... }]
 * })
 * ```
 */
export async function runPromotionTeam(
  input: PromotionTeamInput
): Promise<PromotionTeamOutput> {
  console.log('[PromotionTeam] Starting workflow for:', input.product.name)
  console.log('[PromotionTeam] Similar products:', input.similarProducts.length)

  const initialState: Partial<PromotionTeamState> = {
    product: input.product,
    customerEmails: input.customerEmails,
    similarProducts: input.similarProducts,
    emailDrafts: [],
    iterationCount: 0,
  }

  try {
    const rawResult = await promotionTeamGraph.invoke(initialState)
    // Type assertion for LangGraph result
    const result = rawResult as PromotionTeamState

    return {
      success: result.sendResult?.success ?? false,
      htmlContent: result.sendResult?.htmlContent ?? result.htmlContent ?? null,
      sentCount: result.sendResult?.sentCount ?? 0,
      selectedStyle: result.evaluationResult?.selectedDraft?.style,
      iterations: result.iterationCount ?? 0,
    }
  } catch (error) {
    console.error('[PromotionTeam] Workflow failed:', error)
    return {
      success: false,
      htmlContent: null,
      sentCount: 0,
      iterations: 0,
    }
  }
}
