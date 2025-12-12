/**
 * LangGraph State Types for Promotion Team
 */

import { Annotation } from '@langchain/langgraph'
import type { BaseMessage } from '@langchain/core/messages'
import type {
  ProductInfo,
  PromotionStrategy,
  EmailDraft,
  EvaluationResult,
  ManagerReviewResult,
  WorkflowPhase,
} from '../agents/types'

/**
 * Promotion Team State Annotation
 * Defines the state structure for the LangGraph workflow
 */
export const PromotionTeamAnnotation = Annotation.Root({
  // Core messages for LLM context
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),

  // Input data
  product: Annotation<ProductInfo | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),
  customerEmails: Annotation<string[]>({
    reducer: (_, y) => y,
    default: () => [],
  }),

  // Similar products for recommendation
  similarProducts: Annotation<ProductInfo[]>({
    reducer: (_, y) => y,
    default: () => [],
  }),

  // Manager's strategy
  strategy: Annotation<PromotionStrategy | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),

  // Salesperson drafts
  emailDrafts: Annotation<EmailDraft[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),

  // Evaluator result
  evaluationResult: Annotation<EvaluationResult | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),

  // Final HTML content
  htmlContent: Annotation<string | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),

  // Manager review result
  managerReview: Annotation<ManagerReviewResult | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),

  // Workflow tracking
  currentPhase: Annotation<WorkflowPhase>({
    reducer: (_, y) => y,
    default: () => 'strategy' as WorkflowPhase,
  }),

  // Iteration counter to prevent infinite loops
  iterationCount: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),

  // Final result
  sendResult: Annotation<{
    success: boolean
    sentCount: number
    htmlContent: string
  } | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),

  // Track which salespeople need to regenerate (for selective revision)
  needsRevision: Annotation<{
    salesperson1: boolean
    salesperson2: boolean
  }>({
    reducer: (_, y) => y,
    default: () => ({ salesperson1: false, salesperson2: false }),
  }),
})

export type PromotionTeamState = typeof PromotionTeamAnnotation.State

// Maximum iterations to prevent infinite loops
export const MAX_ITERATIONS = 10
