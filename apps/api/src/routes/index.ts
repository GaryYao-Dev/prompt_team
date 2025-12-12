import { Router, Request, Response, NextFunction } from 'express'
import healthCheckRoute from './healthcheck.route'
import aiRoute from './ai.route'
import notificationRoute from './notification.route'
import { EndpointNotFoundError } from '@/utils/error'

const router: Router = Router()

// routes
router.use('/health', healthCheckRoute)
router.use('/ai', aiRoute)
router.use('/notification', notificationRoute)

// Catch-all route for undefined endpoints
router.use((req: Request, res: Response, next: NextFunction) => {
  next(new EndpointNotFoundError(`Endpoint ${req.path} not found`))
})

export default router
