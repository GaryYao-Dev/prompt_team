/**
 * Tools Module Export
 * Exports promotion team specific tools
 */

// Promotion team tools
export {
  emailTemplateTool,
  renderEmailTemplate,
  convertMarkdownToHtml,
  createEmailTemplate,
} from './email-template.tool'
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
