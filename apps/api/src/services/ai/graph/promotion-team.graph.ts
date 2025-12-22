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
import { afterEvaluation } from './edges'
import {
  managerStrategyNode,
  salesperson1Node,
  salesperson2Node,
  startSalesPhaseNode,
  syncDraftsNode,
  evaluatorNode,
  htmlConverterNode,
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
  // - If approved -> htmlConverter
  // - If not approved -> startSalesPhase for revision
  graph.addConditionalEdges('evaluator', afterEvaluation, [
    'htmlConverter',
    'startSalesPhase',
  ])

  // HTML Converter -> Send Email (Directly, no human review needed for template)
  graph.addEdge('htmlConverter', 'sendEmail')

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
