/**
 * LangGraph Node Functions for Promotion Team
 */

import * as fs from 'fs'
import * as path from 'path'
import { ManagerAgent } from '../agents/manager.agent'
import { SalespersonAgent } from '../agents/salesperson.agent'
import { EvaluatorAgent } from '../agents/evaluator.agent'
import { SalespersonStyle, WorkflowPhase } from '../agents/types'
import type { EmailDraft } from '../agents/types'
import {
  createEmailTemplate,
  convertMarkdownToHtml,
} from '../tools/markdown.tool'
import { saveHtmlToFile, archiveExistingFile } from '../tools/file.tool'
import { sendEmails } from '../tools/email.tool'
import { createLLM } from '../llm'
import type { PromotionTeamState } from './types'

// Base output directory for generated files
const BASE_OUTPUT_DIR = path.join(__dirname, '..', 'output')

// Current session output directory (set when workflow starts)
let currentOutputDir: string = ''

/**
 * Create a timestamped output folder for the current workflow session
 */
function createOutputFolder(productName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const safeName = productName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
  const folderName = `${safeName}_${timestamp}`
  const folderPath = path.join(BASE_OUTPUT_DIR, folderName)

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }

  return folderPath
}

/**
 * Save an email draft as Markdown file
 */
function saveDraftAsMarkdown(draft: EmailDraft, outputDir: string): void {
  const filename = `draft_${draft.salespersonId}_${draft.style}.md`
  const filepath = path.join(outputDir, filename)

  const content = `# ${draft.subject}

**Style:** ${draft.style}
**Salesperson:** ${draft.salespersonId}

---

${draft.bodyMarkdown}
`

  fs.writeFileSync(filepath, content, 'utf-8')
  console.log(`[PromotionTeam] Saved draft: ${filepath}`)
}

// Create LLM instance (can be configured via environment)
const llm = createLLM({
  provider: 'openai',
  model: 'gpt-5-mini',
  timeout: 1800000,
})

// Create agents
const manager = new ManagerAgent(llm)
const salesperson1 = new SalespersonAgent(llm, {
  role: 'salesperson',
  systemPrompt: '', // Set by constructor
  style: SalespersonStyle.RATIONAL,
  salespersonId: 'salesperson-rational',
})
const salesperson2 = new SalespersonAgent(llm, {
  role: 'salesperson',
  systemPrompt: '', // Set by constructor
  style: SalespersonStyle.EMOTIONAL,
  salespersonId: 'salesperson-emotional',
})
const evaluator = new EvaluatorAgent(llm)

/**
 * Node: Synchronize salesperson drafts (fan-in point for parallel execution)
 */
export async function syncDraftsNode(
  state: PromotionTeamState
): Promise<Partial<PromotionTeamState>> {
  console.log(
    '[PromotionTeam] Syncing drafts, count:',
    state.emailDrafts.length
  )
  // This is a sync point - no state changes, just ensures both salespeople finished
  return {}
}

/**
 * Node: Start sales phase (fan-out point for parallel execution)
 * Used as entry point when routing back for revisions
 */
export async function startSalesPhaseNode(
  state: PromotionTeamState
): Promise<Partial<PromotionTeamState>> {
  const needs = state.needsRevision
  console.log('[PromotionTeam] Starting sales phase, needs revision:', needs)
  // This is just a routing node - actual work done by salesperson nodes
  return {}
}

/**
 * Node 1: Manager defines promotion strategy
 */
export async function managerStrategyNode(
  state: PromotionTeamState
): Promise<Partial<PromotionTeamState>> {
  console.log('[PromotionTeam] Manager defining strategy...')

  if (!state.product) {
    throw new Error('Product information is required')
  }

  // Create output folder for this session
  currentOutputDir = createOutputFolder(state.product.name)
  console.log('[PromotionTeam] Output folder:', currentOutputDir)

  const strategy = await manager.defineStrategy(state.product)

  console.log('[PromotionTeam] Strategy defined:', strategy.keySellingPoints)

  return {
    strategy,
    currentPhase: WorkflowPhase.DRAFTING,
    iterationCount: 1,
  }
}

/**
 * Node 2a: Salesperson 1 writes email (Rational style)
 * Skips if this salesperson doesn't need revision (selective regeneration)
 */
export async function salesperson1Node(
  state: PromotionTeamState
): Promise<Partial<PromotionTeamState>> {
  // Skip if we have previous evaluation and this salesperson doesn't need revision
  if (state.evaluationResult && !state.needsRevision?.salesperson1) {
    console.log('[PromotionTeam] Salesperson 1 skipped (no revision needed)')
    return {}
  }

  console.log('[PromotionTeam] Salesperson 1 (Rational) writing email...')

  if (!state.product || !state.strategy) {
    throw new Error('Product and strategy are required')
  }

  // Get specific feedback for this salesperson from draftEvaluations
  const draftFeedback = state.evaluationResult?.draftEvaluations?.find(
    (e) => e.salespersonId === 'salesperson-rational'
  )?.feedback
  const feedback = draftFeedback || state.evaluationResult?.feedback

  const draft = await salesperson1.writeEmail(
    state.product,
    state.strategy,
    state.similarProducts || [],
    feedback
  )

  console.log('[PromotionTeam] Salesperson 1 draft subject:', draft.subject)

  // Save draft as Markdown
  if (currentOutputDir) {
    saveDraftAsMarkdown(draft, currentOutputDir)
  }

  return {
    emailDrafts: [draft],
  }
}

/**
 * Node 2b: Salesperson 2 writes email (Emotional style)
 * Skips if this salesperson doesn't need revision (selective regeneration)
 */
export async function salesperson2Node(
  state: PromotionTeamState
): Promise<Partial<PromotionTeamState>> {
  // Skip if we have previous evaluation and this salesperson doesn't need revision
  if (state.evaluationResult && !state.needsRevision?.salesperson2) {
    console.log('[PromotionTeam] Salesperson 2 skipped (no revision needed)')
    return {}
  }

  console.log('[PromotionTeam] Salesperson 2 (Emotional) writing email...')

  if (!state.product || !state.strategy) {
    throw new Error('Product and strategy are required')
  }

  // Get specific feedback for this salesperson from draftEvaluations
  const draftFeedback = state.evaluationResult?.draftEvaluations?.find(
    (e) => e.salespersonId === 'salesperson-emotional'
  )?.feedback
  const feedback = draftFeedback || state.evaluationResult?.feedback

  const draft = await salesperson2.writeEmail(
    state.product,
    state.strategy,
    state.similarProducts || [],
    feedback
  )

  console.log('[PromotionTeam] Salesperson 2 draft subject:', draft.subject)

  // Save draft as Markdown
  if (currentOutputDir) {
    saveDraftAsMarkdown(draft, currentOutputDir)
  }

  return {
    emailDrafts: [draft],
  }
}

/**
 * Node 3: Evaluator assesses drafts and selects the best
 * Sets needsRevision to enable selective regeneration
 * IMPORTANT: Only evaluates drafts that needed revision, preserves approved drafts
 */
export async function evaluatorNode(
  state: PromotionTeamState
): Promise<Partial<PromotionTeamState>> {
  console.log('[PromotionTeam] Evaluator assessing drafts...')

  if (!state.product || state.emailDrafts.length === 0) {
    throw new Error('Product and email drafts are required')
  }

  // Get the latest drafts (last 2 from each iteration)
  const latestDrafts = state.emailDrafts.slice(-2)

  // Check if we're in a revision cycle (have previous evaluation)
  const prevEval = state.evaluationResult
  const prevNeeds = state.needsRevision

  // Check if manager rejected - if so, we need to re-evaluate everything
  const managerRejected = state.managerReview && !state.managerReview.approved

  // Determine which drafts need evaluation
  const draftsToEvaluate = latestDrafts.filter((draft) => {
    // First evaluation OR manager rejected - evaluate all
    if (!prevEval || !prevNeeds || managerRejected) {
      return true
    }

    // Selective evaluation - only evaluate drafts that needed revision
    if (
      draft.salespersonId === 'salesperson-rational' &&
      prevNeeds.salesperson1
    ) {
      return true
    }
    if (
      draft.salespersonId === 'salesperson-emotional' &&
      prevNeeds.salesperson2
    ) {
      return true
    }
    return false
  })

  // Log manager rejection scenario
  if (managerRejected) {
    console.log('[PromotionTeam] Manager rejected, re-evaluating all drafts')
  }

  console.log(
    `[PromotionTeam] Evaluating ${draftsToEvaluate.length} draft(s):`,
    draftsToEvaluate.map((d) => d.salespersonId)
  )

  // Evaluate only the drafts that need it
  const newResult = await evaluator.evaluate(draftsToEvaluate, state.product)

  // If we have previous evaluations, merge with new ones
  let finalDraftEvaluations = newResult.draftEvaluations || []

  if (prevEval?.draftEvaluations && prevNeeds) {
    // Get previous evaluations for salespeople who didn't need revision
    const keptEvaluations = prevEval.draftEvaluations.filter((e) => {
      if (
        e.salespersonId === 'salesperson-rational' &&
        !prevNeeds.salesperson1
      ) {
        console.log(
          '[PromotionTeam] Keeping previous evaluation for salesperson-rational (PASS)'
        )
        return true
      }
      if (
        e.salespersonId === 'salesperson-emotional' &&
        !prevNeeds.salesperson2
      ) {
        console.log(
          '[PromotionTeam] Keeping previous evaluation for salesperson-emotional (PASS)'
        )
        return true
      }
      return false
    })

    // Merge: kept evaluations + new evaluations
    finalDraftEvaluations = [
      ...keptEvaluations,
      ...(newResult.draftEvaluations || []),
    ]
  }

  // Build final result
  const finalResult = {
    ...newResult,
    draftEvaluations: finalDraftEvaluations,
    approved: finalDraftEvaluations.every((e) => e.approved),
  }

  // Select best draft from all latest drafts
  if (finalResult.approved) {
    // Find highest scoring draft
    const bestEval = finalDraftEvaluations.reduce((best, curr) =>
      curr.score > best.score ? curr : best
    )
    const bestDraft = latestDrafts.find(
      (d) => d.salespersonId === bestEval.salespersonId
    )
    if (bestDraft) {
      finalResult.selectedDraft = bestDraft
    }
  }

  console.log(
    '[PromotionTeam] Evaluation result:',
    finalResult.approved ? 'APPROVED' : 'NEEDS REVISION'
  )

  // Log per-draft evaluation results
  if (finalDraftEvaluations) {
    finalDraftEvaluations.forEach((e) => {
      console.log(
        `[PromotionTeam] ${e.salespersonId}: ${e.approved ? 'PASS' : 'FAIL'} (score: ${e.score})`
      )
      if (!e.approved && e.feedback) {
        console.log(`[PromotionTeam] Feedback: ${e.feedback}`)
      }
    })
  }

  // Log overall feedback if revision is needed
  if (!finalResult.approved && finalResult.feedback) {
    console.log('[PromotionTeam] Overall feedback:', finalResult.feedback)
  }

  // Determine which salespeople need revision based on individual evaluations
  const rational = finalDraftEvaluations.find(
    (e) => e.salespersonId === 'salesperson-rational'
  )
  const emotional = finalDraftEvaluations.find(
    (e) => e.salespersonId === 'salesperson-emotional'
  )
  const needsRevision = {
    salesperson1: rational ? !rational.approved : true,
    salesperson2: emotional ? !emotional.approved : true,
  }

  console.log('[PromotionTeam] Needs revision:', needsRevision)

  // Generate HTML if all drafts approved
  let htmlContent: string | null = null
  if (finalResult.approved && finalResult.selectedDraft && state.product) {
    htmlContent = await evaluator.generateHtml(
      finalResult.selectedDraft,
      state.product
    )

    // Save HTML version for review/debugging
    if (currentOutputDir && htmlContent) {
      const { filepath, version } = saveHtmlToFile(
        currentOutputDir,
        htmlContent,
        'email_draft',
        true // Create versioned file
      )
      console.log(`[PromotionTeam] HTML draft saved: ${filepath} (v${version})`)
    }
  }

  return {
    evaluationResult: finalResult,
    htmlContent,
    needsRevision,
    currentPhase: finalResult.approved
      ? WorkflowPhase.MANAGER_REVIEW // Skip to manager review since HTML is generated
      : WorkflowPhase.DRAFTING,
    iterationCount: 1,
  }
}

/**
 * Node 4: HTML Converter (pure tool, no LLM)
 * Used as fallback when evaluator didn't generate HTML
 */
export async function htmlConverterNode(
  state: PromotionTeamState
): Promise<Partial<PromotionTeamState>> {
  console.log('[PromotionTeam] Converting to HTML...')

  if (!state.evaluationResult?.selectedDraft || !state.product) {
    throw new Error('Selected draft and product are required')
  }

  const draft = state.evaluationResult.selectedDraft
  const bodyHtml = convertMarkdownToHtml(draft.bodyMarkdown)
  const fullHtml = createEmailTemplate(
    draft.subject,
    bodyHtml,
    state.product.productUrl,
    'Shop Now'
  )

  console.log('[PromotionTeam] HTML generated, length:', fullHtml.length)

  return {
    htmlContent: fullHtml,
    currentPhase: WorkflowPhase.MANAGER_REVIEW,
  }
}

/**
 * Node 4b: HTML Fixer (uses LLM to fix HTML issues based on manager feedback)
 * Called when manager rejects for format/content issues
 */
export async function htmlFixerNode(
  state: PromotionTeamState
): Promise<Partial<PromotionTeamState>> {
  console.log('[PromotionTeam] Fixing HTML based on manager feedback...')

  if (!state.htmlContent || !state.product) {
    throw new Error('HTML content and product are required')
  }

  const feedback = state.managerReview?.feedback || 'Fix HTML issues'
  const fixedHtml = await evaluator.fixHtml(
    state.htmlContent,
    feedback,
    state.product
  )

  console.log('[PromotionTeam] HTML fixed, length:', fixedHtml.length)

  // Save fixed HTML version for review/debugging
  if (currentOutputDir && fixedHtml) {
    const { filepath, version } = saveHtmlToFile(
      currentOutputDir,
      fixedHtml,
      'email_fixed',
      true // Create versioned file
    )
    console.log(`[PromotionTeam] Fixed HTML saved: ${filepath} (v${version})`)
  }

  return {
    htmlContent: fixedHtml,
    currentPhase: WorkflowPhase.MANAGER_REVIEW,
    iterationCount: 1,
  }
}

/**
 * Node 5: Manager final approval
 */
export async function managerReviewNode(
  state: PromotionTeamState
): Promise<Partial<PromotionTeamState>> {
  console.log('[PromotionTeam] Manager reviewing final email...')

  if (!state.htmlContent || !state.product) {
    throw new Error('HTML content and product are required')
  }

  // Pass similar products to the review so manager knows what to look for
  const review = await manager.reviewFinalEmail(
    state.htmlContent,
    state.product,
    state.similarProducts || []
  )

  console.log(
    '[PromotionTeam] Manager review:',
    review.approved ? 'APPROVED' : 'REJECTED'
  )

  return {
    managerReview: review,
    currentPhase: review.approved
      ? WorkflowPhase.SENDING
      : WorkflowPhase.EVALUATION,
    iterationCount: 1,
  }
}

/**
 * Node 6: Send emails and save HTML to output folder
 */
export async function sendEmailNode(
  state: PromotionTeamState
): Promise<Partial<PromotionTeamState>> {
  console.log('[PromotionTeam] Sending emails...')

  if (!state.htmlContent || !state.evaluationResult?.selectedDraft) {
    throw new Error('HTML content and selected draft are required')
  }

  // Save HTML to output folder
  const filename = 'final_email.html'
  const filepath = path.join(currentOutputDir || BASE_OUTPUT_DIR, filename)

  // Ensure output directory exists
  const outputDir = currentOutputDir || BASE_OUTPUT_DIR
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(filepath, state.htmlContent, 'utf-8')
  console.log('[PromotionTeam] HTML saved to:', filepath)

  const result = await sendEmails(
    state.customerEmails,
    state.evaluationResult.selectedDraft.subject,
    state.htmlContent
  )

  console.log('[PromotionTeam] Emails sent:', result.sentCount)

  return {
    sendResult: {
      success: result.success,
      sentCount: result.sentCount,
      htmlContent: state.htmlContent,
    },
    currentPhase: WorkflowPhase.COMPLETED,
  }
}
