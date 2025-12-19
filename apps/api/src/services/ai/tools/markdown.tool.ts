/**
 * Markdown to HTML Conversion Tool
 * Uses 'marked' library for proper markdown parsing
 * Styled to match ModaFitClub website (https://www.modafitclub.com)
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { marked } from 'marked'

// Configure marked for our use case
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
})

/**
 * Convert Markdown to HTML using marked library
 * Then apply custom styling for prices, images, and buttons
 */
function convertMarkdownToHtml(markdown: string): string {
  // Pre-process: remove metadata lines if present
  let cleanMarkdown = markdown
    .replace(/^\*\*Style:\*\*.*$/gm, '')
    .replace(/^\*\*Salesperson:\*\*.*$/gm, '')
    .replace(/^---+$/gm, '') // Remove horizontal rules from content
    .trim()

  // Use marked to convert markdown to HTML
  let html = marked.parse(cleanMarkdown) as string

  // Post-process: Apply custom styling

  // 1. Style product images
  html = html.replace(
    /<img src="([^"]+)" alt="([^"]*)">/g,
    '<div class="product-image"><img src="$1" alt="$2"></div>'
  )

  // 2. Style strikethrough prices with original-price class
  html = html.replace(
    /<del>([^<]+)<\/del>/g,
    '<del class="original-price">$1</del>'
  )

  // 3. Create price-action sections for discount prices (use span for inline compatibility)
  // Pattern: <del>$XX.XX</del> <strong>$XX.XX</strong> <strong>XX% OFF</strong> <a href="...">Shop Now</a>
  html = html.replace(
    /<del class="original-price">(\$[\d.]+)<\/del>\s*<strong>(\$[\d.]+)<\/strong>\s*<strong>([^<]+OFF[^<]*)<\/strong>\s*<a href="([^"]+)">Shop Now<\/a>/gi,
    '</p><div class="price-action"><del class="original-price">$1</del> <span class="price">$2</span> <span class="discount-badge">$3</span> <a href="$4" class="shop-now-btn">Shop Now</a></div><p>'
  )

  // 4. Create price-action sections for simple prices (use span for inline compatibility)
  // Pattern: <strong>$XX.XX</strong> <a href="...">Shop Now</a>
  html = html.replace(
    /<strong>(\$[\d.]+)<\/strong>\s*<a href="([^"]+)">Shop Now<\/a>/gi,
    '</p><div class="price-action"><span class="price">$1</span> <a href="$2" class="shop-now-btn">Shop Now</a></div><p>'
  )

  // 5. Style remaining "Shop Now" links as buttons
  html = html.replace(
    /<a href="([^"]+)">Shop Now<\/a>/gi,
    '<a href="$1" class="shop-now-btn">Shop Now</a>'
  )

  // 6. Wrap standalone prices in price class
  html = html.replace(
    /<strong>(\$[\d.]+)<\/strong>/g,
    '<strong><span class="price">$1</span></strong>'
  )

  // 7. Style h3 as product titles
  html = html.replace(/<h3>/g, '<h3 class="product-title">')

  // 8. Replace common placeholders with ModaFitClub brand name
  const placeholderReplacements: [RegExp, string][] = [
    [/\[Your Brand Name\]/gi, 'ModaFitClub'],
    [/\[Brand Name\]/gi, 'ModaFitClub'],
    [/\[Your Company\]/gi, 'ModaFitClub'],
    [/\[Company Name\]/gi, 'ModaFitClub'],
    [/\[Your Name\]/gi, 'The ModaFitClub Team'],
    [/\[Team Name\]/gi, 'The ModaFitClub Team'],
    [/\[Your Store\]/gi, 'ModaFitClub'],
    [/\[Store Name\]/gi, 'ModaFitClub'],
  ]
  for (const [pattern, replacement] of placeholderReplacements) {
    html = html.replace(pattern, replacement)
  }

  // 9. Fix invalid HTML nesting and cleanup
  // Handle <p>text...<div> by closing p before div
  html = html.replace(/(<p>[^<]*)<div/g, '$1</p><div')
  html = html.replace(/<\/div>([^<]*<\/p>)/g, '</div><p>$1')

  // Remove <p> tags that directly wrap block elements
  html = html.replace(/<p>\s*(<div[^>]*>)/g, '$1')
  html = html.replace(/(<\/div>)\s*<\/p>/g, '$1')

  // Fix <p> wrapping headings
  html = html.replace(/<p>\s*(<h[1-6][^>]*>)/g, '$1')
  html = html.replace(/(<\/h[1-6]>)\s*<\/p>/g, '$1')

  // Remove empty paragraphs (including those created by our fixes)
  html = html.replace(/<p>\s*<\/p>/g, '')
  html = html.replace(/<\/p>\s*<p>/g, '</p><p>') // Normalize spacing
  html = html.replace(/<p><\/p>/g, '')

  return html
}

/**
 * Create HTML email template styled to match ModaFitClub website
 * - Clean, minimalist design
 * - White background with dark text
 * - Modern e-commerce aesthetic
 * - Product card styling for recommendations
 */
function createEmailTemplate(
  subject: string,
  bodyHtml: string,
  ctaUrl: string,
  ctaText: string = 'Shop Now'
): string {
  // Homepage URL for the main CTA
  const homepageUrl = 'https://www.modafitclub.com'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    /* ModaFitClub Brand Colors - Hardcoded for email client compatibility */
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      line-height: 1.7;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      background-color: #f8f8f8;
    }
    
    .email-wrapper {
      padding: 40px 20px;
    }
    
    .email-container {
      background-color: #ffffff;
      border-radius: 0;
      padding: 40px;
      box-shadow: none;
      border: 1px solid #e5e5e5;
    }
    
    .logo {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #171016;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin: 0;
    }
    
    h1 {
      color: #171016;
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 25px 0;
      line-height: 1.4;
    }
    
    h2 {
      color: #171016;
      font-size: 18px;
      font-weight: 600;
      margin: 25px 0 15px 0;
    }
    
    h3 {
      color: #171016;
      font-size: 16px;
      font-weight: 600;
      margin: 20px 0 12px 0;
    }
    
    h4 {
      color: #171016;
      font-size: 15px;
      font-weight: 600;
      margin: 18px 0 10px 0;
      border-bottom: 2px solid #cbad62;
      padding-bottom: 8px;
    }
    
    p {
      margin: 0 0 18px 0;
      color: #333333;
      font-size: 15px;
    }
    
    a {
      color: #171016;
      text-decoration: underline;
    }
    
    /* Product Card Styling */
    .product-image {
      text-align: center;
      margin: 15px 0;
    }
    
    .product-image img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      border: 1px solid #e5e5e5;
    }
    
    /* Price Styling - Prominent with accent color */
    .price {
      display: inline-block;
      font-size: 20px;
      font-weight: 700;
      color: #cbad62;
      border-radius: 4px;
      vertical-align: middle;
      text-align: center;
    }
    
    /* Original Price - Strikethrough */
    .original-price {
      display: inline-block;
      text-decoration: line-through;
      color: #666666;
      font-size: 14px;
      margin-right: 8px;
      vertical-align: middle;
    }
    
    /* Discount Badge */
    .discount-badge {
      display: inline-block;
      background-color: #e74c3c;
      color: white;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      margin: 0 8px;
      vertical-align: middle;
      text-transform: uppercase;
    }
    
    /* Price Action Section - Inline-block for email client compatibility */
    .price-action {
      margin: 15px 0 20px 0;
      padding: 15px;
      background-color: #f8f8f8;
      border-radius: 8px;
      text-align: left;
    }
    
    .price-action span,
    .price-action del,
    .price-action a {
      display: inline-block;
      vertical-align: middle;
      margin-right: 8px;
    }
    
    /* Shop Now Button - Inline style matching CTA */
    .shop-now-btn {
      display: inline-block;
      background-color: #cbad62;
      color: #171016 !important;
      text-decoration: none !important;
      padding: 10px 25px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 4px;
      margin: 0;
      vertical-align: middle;
    }
    
    .cta-section {
      text-align: center;
      margin: 35px 0;
      padding: 25px 0;
      border-top: 1px solid #e5e5e5;
    }
    
    .cta-button {
      display: inline-block;
      background-color: #cbad62;
      color: #171016 !important;
      text-decoration: none;
      padding: 14px 40px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border: none;
    }
    
    .divider {
      height: 1px;
      background-color: #e5e5e5;
      margin: 30px 0;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 25px;
      border-top: 1px solid #e5e5e5;
      font-size: 12px;
      color: #666666;
      text-align: center;
    }
    
    .footer a {
      color: #666666;
      text-decoration: underline;
    }
    
    .footer p {
      font-size: 12px;
      color: #666666;
      margin: 8px 0;
    }
    
    ul {
      padding-left: 20px;
      margin: 15px 0;
    }
    
    li {
      margin: 10px 0;
      color: #333333;
      font-size: 15px;
    }
    
    strong {
      color: #171016;
      font-weight: 600;
    }
    
    del {
      text-decoration: line-through;
      color: #666666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="logo">
        <p class="logo-text">ModaFitClub</p>
      </div>
      
      <h1>${subject}</h1>
      
      ${bodyHtml}
      
      <div class="cta-section">
        <p style="margin-bottom: 15px; color: #666666;">Explore our full collection</p>
        <a href="${homepageUrl}" class="cta-button">${ctaText}</a>
      </div>
      
      <div class="footer">
        <p>Follow us for the latest styles and exclusive offers</p>
        <p>
          <a href="${homepageUrl}">Visit Our Store</a> | 
          <a href="https://www.modafitclub.com/unsubscribe">Unsubscribe</a>
        </p>
        <p style="margin-top: 15px;">© 2025 ModaFitClub. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

/**
 * Markdown to HTML tool for LangGraph
 */
export const markdownToHtmlTool = tool(
  async ({ markdown, subject, ctaUrl, ctaText }) => {
    const bodyHtml = convertMarkdownToHtml(markdown)
    const fullHtml = createEmailTemplate(subject, bodyHtml, ctaUrl, ctaText)
    return fullHtml
  },
  {
    name: 'markdown_to_html',
    description:
      'Convert Markdown email content to a styled HTML email template',
    schema: z.object({
      markdown: z.string().describe('Markdown content to convert'),
      subject: z.string().describe('Email subject line'),
      ctaUrl: z.string().describe('URL for the call-to-action button'),
      ctaText: z
        .string()
        .optional()
        .describe('Text for the CTA button, defaults to "Shop Now"'),
    }),
  }
)

// Export the pure functions for direct use
export { convertMarkdownToHtml, createEmailTemplate }
