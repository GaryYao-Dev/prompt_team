/**
 * Tools Module Export
 * Exports promotion team specific tools
 */

// Promotion team tools
export {
  markdownToHtmlTool,
  convertMarkdownToHtml,
  createEmailTemplate,
} from './markdown.tool'
export { sendEmailTool, sendEmails, type EmailSendResult } from './email.tool'
export {
  getProductByUrl,
  getProductById,
  findSimilarProducts,
  getAllProducts,
  getProductsByCategory,
  getDatabaseConfig,
  RECOMMENDED_PRODUCTS_COUNT,
  type Product,
} from './database.tool'
