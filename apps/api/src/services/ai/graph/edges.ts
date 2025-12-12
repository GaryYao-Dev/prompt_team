/**
 * LangGraph Conditional Edge Functions
 */

import { END } from '@langchain/langgraph'
import type { PromotionTeamState } from './types'
import { MAX_ITERATIONS } from './types'

/**
 * Route after evaluator assessment
 */
export function afterEvaluation(state: PromotionTeamState): string {
  // Check iteration limit
  if (state.iterationCount >= MAX_ITERATIONS) {
    console.log(
      '[PromotionTeam] Max iterations reached after evaluator, proceeding with best draft'
    )
    return 'htmlConverter'
  }

  if (state.evaluationResult?.approved) {
    return 'htmlConverter'
  }

  // Needs revision - go back to salespeople
  console.log('[PromotionTeam] Drafts need revision')
  return 'salesperson1'
}

/**
 * Route after manager review
 * CRITICAL: If max iterations reached with rejection, ABORT - do not send incorrect emails
 */
export function afterManagerReview(
  state: PromotionTeamState
): 'sendEmail' | 'evaluator' | typeof END {
  // If approved, send the email
  if (state.managerReview?.approved) {
    return 'sendEmail'
  }

  // Check iteration limit - ABORT if rejected at max iterations
  if (state.iterationCount >= MAX_ITERATIONS) {
    console.error(
      '[PromotionTeam] CRITICAL: Max iterations reached but email still rejected. ABORTING to prevent sending incorrect content.'
    )
    console.error(
      '[PromotionTeam] Rejection reason:',
      state.managerReview?.feedback
    )
    // Return END to abort the workflow - do NOT send incorrect emails
    return END
  }

  // Manager rejected - need content revision
  if (state.managerReview?.requiresContentRevision) {
    console.log('[PromotionTeam] Manager requires content revision')
    return 'evaluator'
  }

  // Format issues - also need revision
  if (state.managerReview?.requiresFormatRevision) {
    console.log('[PromotionTeam] Manager requires format revision')
    return 'evaluator'
  }

  // Unknown rejection reason - try revision
  console.log('[PromotionTeam] Manager rejected, attempting revision')
  return 'evaluator'
}

/**
 * Simple router after sending - always ends
 */
export function afterSendEmail(): typeof END {
  return END
}
