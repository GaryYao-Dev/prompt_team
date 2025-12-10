import { Request, Response, Router } from 'express'
  import { ApiResponse } from '@shared/types'

  const router: Router = Router()

  router.get('/', (req: Request, res: Response) => {
    const response: ApiResponse<string> = {
      data: 'API service is healthy',
      success: true,
      timestamp: new Date().toISOString(),
    }
    res.status(200).json(response)
  })

  export default router
  