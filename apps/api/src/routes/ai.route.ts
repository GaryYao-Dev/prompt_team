import { Router, type Request, type Response } from 'express'
import { runPromotionTeam } from '../services/ai'
import {
  getProductByUrl,
  findSimilarProducts,
  RECOMMENDED_PRODUCTS_COUNT,
  type Product,
} from '../services/ai/tools/database.tool'
import type { ProductInfo } from '../services/ai/agents/types'

const router: Router = Router()

/**
 * Convert database Product to ProductInfo
 */
function toProductInfo(product: Product): ProductInfo {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    discount: product.discount,
    category: product.category,
    tags: product.tags,
    productUrl: product.productUrl,
    imageUrl: product.imageUrl,
  }
}

/**
 * POST /ai/promotion-email
 * Generate and send promotional emails for a product
 *
 * Request body:
 * {
 *   "productUrl": "https://www.modafitclub.com/APE-tshirt-2.html",
 *   "customerEmails": ["email1@example.com", "email2@example.com"]
 * }
 *
 * The system will:
 * 1. Look up the product from the database by productUrl
 * 2. Find similar products to recommend
 * 3. Generate promotional email with product recommendations
 */
router.post(
  '/promotion-email',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { productUrl, customerEmails } = req.body as {
        productUrl: string
        customerEmails: string[]
      }

      // Validate input
      if (!productUrl) {
        res.status(400).json({
          error: 'Invalid request: productUrl is required',
        })
        return
      }

      if (
        !customerEmails ||
        !Array.isArray(customerEmails) ||
        customerEmails.length === 0
      ) {
        res.status(400).json({
          error: 'Invalid request: customerEmails array is required',
        })
        return
      }

      // Look up product from database by productUrl
      const product = getProductByUrl(productUrl)
      if (!product) {
        res.status(404).json({
          error: `Product not found for URL: ${productUrl}`,
        })
        return
      }

      // Find similar products for recommendation
      const similarProducts = findSimilarProducts(
        productUrl,
        RECOMMENDED_PRODUCTS_COUNT
      )

      console.log(`[AI Route] Product: ${product.name}`)
      console.log(`[AI Route] Similar products: ${similarProducts.length}`)

      // Run the promotion team workflow
      const result = await runPromotionTeam({
        product: toProductInfo(product),
        customerEmails,
        similarProducts: similarProducts.map(toProductInfo),
      })

      if (result.success) {
        res.json({
          success: true,
          message: `Successfully processed ${result.sentCount} emails`,
          data: {
            productUrl,
            productName: product.name,
            similarProductsCount: similarProducts.length,
            sentCount: result.sentCount,
            selectedStyle: result.selectedStyle,
            iterations: result.iterations,
            htmlContent: result.htmlContent,
          },
        })
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to generate or send promotional emails',
          data: {
            htmlContent: result.htmlContent,
            iterations: result.iterations,
          },
        })
      }
    } catch (error) {
      console.error('[AI Route] Error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)

/**
 * GET /ai/health
 * Health check for AI service
 */
router.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    service: 'ai-promotion-team',
    recommendedProductsCount: RECOMMENDED_PRODUCTS_COUNT,
    timestamp: new Date().toISOString(),
  })
})

export default router
