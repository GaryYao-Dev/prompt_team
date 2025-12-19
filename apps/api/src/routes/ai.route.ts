import { Router, type Request, type Response } from 'express'
import { runPromotionTeam } from '../services/ai'
import {
  getProductByUrl,
  findSimilarProducts,
  RECOMMENDED_PRODUCTS_COUNT,
  type Product,
} from '../services/ai/tools/database.tool'
import { sendEmails } from '../services/ai/tools/email.tool'
import type { ProductInfo } from '../services/ai/agents/types'
import fs from 'fs'
import path from 'path'

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

/**
 * POST /ai/test-send-email
 * Test endpoint to send an existing HTML file as email
 *
 * Request body:
 * {
 *   "htmlPath": "APE_Fashion_New_Hoodie_2025-12-16T11-17-37/final_email.html",
 *   "emails": ["test@example.com"],
 *   "subject": "Test Email Subject"
 * }
 */
router.post(
  '/test-send-email',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { htmlPath, emails, subject } = req.body as {
        htmlPath: string
        emails: string[]
        subject?: string
      }

      // Validate input
      if (!htmlPath) {
        res.status(400).json({
          error: 'Invalid request: htmlPath is required',
        })
        return
      }

      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        res.status(400).json({
          error: 'Invalid request: emails array is required',
        })
        return
      }

      // Build full path to HTML file
      const outputDir = path.join(__dirname, '../services/ai/output', htmlPath)

      // Check if file exists
      if (!fs.existsSync(outputDir)) {
        res.status(404).json({
          error: `HTML file not found: ${htmlPath}`,
          searchedPath: outputDir,
        })
        return
      }

      // Read HTML content
      const htmlContent = fs.readFileSync(outputDir, 'utf-8')

      // Extract subject from HTML title if not provided
      const emailSubject =
        subject ||
        htmlContent.match(/<title>([^<]+)<\/title>/)?.[1] ||
        'Test Promotional Email'

      // Send email using static import
      const result = await sendEmails(emails, emailSubject, htmlContent)

      res.json({
        success: result.success,
        message: `Sent ${result.sentCount} emails`,
        data: {
          htmlPath,
          subject: emailSubject,
          sentCount: result.sentCount,
          failedEmails: result.failedEmails,
          timestamp: result.timestamp,
        },
      })
    } catch (error) {
      console.error('[AI Route] Test email error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)

export default router
