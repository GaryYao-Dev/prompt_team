/**
 * Notification Route - Deprecated
 * This route is kept for backward compatibility.
 * The AI service now focuses on the promotion team workflow.
 */

import { Router, Request, Response } from 'express'

const router: Router = Router()

/**
 * POST /api/notification/send
 * @deprecated Use /api/ai/promotion-email instead
 */
router.post('/send', async (_req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    error:
      'This endpoint is deprecated. Use /api/ai/promotion-email for promotional emails.',
  })
})

export default router
