/**
 * LangGraph Conditional Edge Functions
 */

import { END } from '@langchain/langgraph'
import type { PromotionTeamState } from './types'
import { MAX_ITERATIONS } from './types'

/**
 * Route after evaluator assessment
 * - If approved -> htmlConverter
 * - If not approved -> startSalesPhase for revision
 * - If max iterations -> htmlConverter (best effort)
 */
export function afterEvaluation(
  state: PromotionTeamState
): 'htmlConverter' | 'startSalesPhase' {
  // Max iterations check
  if (state.iterationCount >= MAX_ITERATIONS) {
    console.log(
      '[PromotionTeam] Max iterations reached, proceeding with best draft'
    )
    return 'htmlConverter'
  }

  // If approved, proceed to conversion
  if (state.evaluationResult?.approved) {
    console.log('[PromotionTeam] Drafts approved, proceeding to conversion')
    return 'htmlConverter'
  }

  // Route to startSalesPhase for revision
  const needs = state.needsRevision
  if (needs?.salesperson1 && needs?.salesperson2) {
    console.log('[PromotionTeam] Both drafts need revision')
  } else if (needs?.salesperson1) {
    console.log('[PromotionTeam] Only salesperson1 needs revision')
  } else if (needs?.salesperson2) {
    console.log('[PromotionTeam] Only salesperson2 needs revision')
  }
  return 'startSalesPhase'
}

/**
 * Simple router after sending - always ends
 */
export function afterSendEmail(): typeof END {
  return END
}
