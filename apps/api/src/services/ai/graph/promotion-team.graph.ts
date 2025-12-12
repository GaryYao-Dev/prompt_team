/**
 * Promotion Team LangGraph
 * Orchestrates multi-agent workflow for promotional email generation
 */

import * as fs from 'node:fs'

import {
  StateGraph,
  START,
  END,
  type CompiledStateGraph,
} from '@langchain/langgraph'
import {
  PromotionTeamAnnotation,
  type PromotionTeamState,
  MAX_ITERATIONS,
} from './types'
import {
  managerStrategyNode,
  salesperson1Node,
  salesperson2Node,
  startSalesPhaseNode,
  syncDraftsNode,
  evaluatorNode,
  htmlConverterNode,
  htmlFixerNode,
  managerReviewNode,
  sendEmailNode,
} from './nodes'

/**
 * Build the promotion team workflow graph
 *
 * Flow:
 * START -> managerStrategy -> startSalesPhase -> [salesperson1, salesperson2] (parallel)
 *       -> syncDrafts -> evaluator (generates HTML if approved)
 *       -> managerApproval -> sendEmail -> END
 *
 * With feedback loops:
 * - evaluator routes back to startSalesPhase for draft revisions
 * - managerApproval routes to htmlFixer for format issues
 * - managerApproval routes back to startSalesPhase for content revision
 */
function buildPromotionTeamGraph(): CompiledStateGraph<
  PromotionTeamState,
  Partial<PromotionTeamState>
> {
  // Use 'any' type assertion to work around LangGraph's strict typing
  // This is a known limitation of LangGraph's TypeScript types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graph = new StateGraph(PromotionTeamAnnotation) as any

  // Add nodes
  graph.addNode('managerStrategy', managerStrategyNode)
  graph.addNode('startSalesPhase', startSalesPhaseNode)
  graph.addNode('salesperson1', salesperson1Node)
  graph.addNode('salesperson2', salesperson2Node)
  graph.addNode('syncDrafts', syncDraftsNode)
  graph.addNode('evaluator', evaluatorNode)
  graph.addNode('htmlConverter', htmlConverterNode)
  graph.addNode('htmlFixer', htmlFixerNode)
  graph.addNode('managerApproval', managerReviewNode)
  graph.addNode('sendEmail', sendEmailNode)

  // Define edges
  // START -> Manager Strategy
  graph.addEdge(START, 'managerStrategy')

  // Manager Strategy -> Start Sales Phase
  graph.addEdge('managerStrategy', 'startSalesPhase')

  // Start Sales Phase -> Salesperson1 AND Salesperson2 (parallel fan-out)
  graph.addEdge('startSalesPhase', 'salesperson1')
  graph.addEdge('startSalesPhase', 'salesperson2')

  // Both Salespeople -> SyncDrafts (fan-in synchronization point)
  graph.addEdge('salesperson1', 'syncDrafts')
  graph.addEdge('salesperson2', 'syncDrafts')

  // SyncDrafts -> Evaluator
  graph.addEdge('syncDrafts', 'evaluator')

  // Evaluator -> Conditional
  // - If approved AND has HTML -> managerApproval (evaluator generated HTML)
  // - If approved but no HTML -> htmlConverter (fallback)
  // - If not approved -> startSalesPhase for revision
  graph.addConditionalEdges(
    'evaluator',
    (state: PromotionTeamState) => {
      if (state.iterationCount >= MAX_ITERATIONS) {
        console.log(
          '[PromotionTeam] Max iterations reached, proceeding with best draft'
        )
        return state.htmlContent ? 'managerApproval' : 'htmlConverter'
      }
      if (state.evaluationResult?.approved) {
        // Evaluator generates HTML when approved
        if (state.htmlContent) {
          console.log('[PromotionTeam] Drafts approved, HTML generated')
          return 'managerApproval'
        }
        // Fallback to htmlConverter if no HTML
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
    },
    ['managerApproval', 'htmlConverter', 'startSalesPhase']
  )

  // HTML Converter -> Manager Review
  graph.addEdge('htmlConverter', 'managerApproval')

  // HTML Fixer -> Manager Review (after fixing)
  graph.addEdge('htmlFixer', 'managerApproval')

  // Manager Review -> Conditional (sendEmail, htmlFixer, startSalesPhase, or END)
  // CRITICAL: If rejected at max iterations, ABORT - do not send incorrect content
  graph.addConditionalEdges(
    'managerApproval',
    (state: PromotionTeamState) => {
      // If approved, send the email
      if (state.managerReview?.approved) {
        return 'sendEmail'
      }

      // Log rejection reason for every rejection
      console.log(
        '[PromotionTeam] Manager REJECTED. Reason:',
        state.managerReview?.feedback
      )

      // CRITICAL: If max iterations reached with rejection, ABORT
      if (state.iterationCount >= MAX_ITERATIONS) {
        console.error(
          '[PromotionTeam] CRITICAL: Max iterations reached but email still rejected. ABORTING.'
        )
        return END
      }

      // Format issues only - use htmlFixer to fix HTML
      if (
        state.managerReview?.requiresFormatRevision &&
        !state.managerReview?.requiresContentRevision
      ) {
        console.log(
          '[PromotionTeam] Manager requires format revision, using htmlFixer'
        )
        return 'htmlFixer'
      }

      // Content revision needed - go back to salespeople
      if (state.managerReview?.requiresContentRevision) {
        console.log(
          '[PromotionTeam] Manager requires content revision, going back to sales phase'
        )
        return 'startSalesPhase'
      }

      // Unknown rejection - try htmlFixer first
      console.log('[PromotionTeam] Manager rejected, attempting HTML fix first')
      return 'htmlFixer'
    },
    ['sendEmail', 'htmlFixer', 'startSalesPhase', END]
  )

  // Send Email -> END
  graph.addEdge('sendEmail', END)
  const graphCompile = graph.compile()

  // Generate and save the graph visualization as PNG
  graphCompile
    .getGraph()
    .drawMermaidPng()
    .then(async (pngBlob: Blob) => {
      const arrayBuffer = await pngBlob.arrayBuffer()
      fs.writeFileSync('promotion-team.png', Buffer.from(arrayBuffer))
      console.log('[PromotionTeam] Graph PNG saved to promotion-team.png')
    })
    .catch((err: Error) => {
      console.error('[PromotionTeam] Failed to save graph PNG:', err)
    })
  return graphCompile as CompiledStateGraph<
    PromotionTeamState,
    Partial<PromotionTeamState>
  >
}

// Export compiled graph
export const promotionTeamGraph = buildPromotionTeamGraph()

// Export type for state
export type { PromotionTeamState } from './types'
export { PromotionTeamAnnotation } from './types'
