/**
 * Database Tool - Mock Product Database
 * Queries products by productUrl and finds similar products
 */

import * as fs from 'fs'
import * as path from 'path'

// Configurable: Number of similar products to recommend
export const RECOMMENDED_PRODUCTS_COUNT = 3

// Product interface matching the JSON structure
export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  discount?: string
  category: string
  tags: string[]
  imageUrl: string
  productUrl: string
}

interface ProductDatabase {
  products: Product[]
  categories: string[]
  config: {
    baseUrl: string
    imageBaseUrl: string
    logoUrl: string
  }
}

// Load database from JSON file
const DATABASE_PATH = path.join(__dirname, '..', 'data', 'products.json')

function loadDatabase(): ProductDatabase {
  const data = fs.readFileSync(DATABASE_PATH, 'utf-8')
  return JSON.parse(data) as ProductDatabase
}

/**
 * Get product by productUrl (primary lookup method)
 */
export function getProductByUrl(productUrl: string): Product | null {
  const db = loadDatabase()
  return db.products.find((p) => p.productUrl === productUrl) || null
}

/**
 * Get product by ID (secondary lookup method)
 */
export function getProductById(productId: string): Product | null {
  const db = loadDatabase()
  return db.products.find((p) => p.id === productId) || null
}

/**
 * Get all products
 */
export function getAllProducts(): Product[] {
  const db = loadDatabase()
  return db.products
}

/**
 * Find similar products based on category and tags
 * Returns products that share the same category or have overlapping tags
 * Uses productUrl as the identifier
 */
export function findSimilarProducts(
  productUrl: string,
  count: number = RECOMMENDED_PRODUCTS_COUNT
): Product[] {
  const db = loadDatabase()
  const sourceProduct = db.products.find((p) => p.productUrl === productUrl)

  if (!sourceProduct) {
    // If product not found, return random products
    return db.products.slice(0, count)
  }

  // Score products by similarity
  const scoredProducts = db.products
    .filter((p) => p.productUrl !== productUrl) // Exclude the source product
    .map((product) => {
      let score = 0

      // Same category = 10 points
      if (product.category === sourceProduct.category) {
        score += 10
      }

      // Overlapping tags = 2 points each
      const overlappingTags = product.tags.filter((tag) =>
        sourceProduct.tags.includes(tag)
      )
      score += overlappingTags.length * 2

      return { product, score }
    })
    .sort((a, b) => b.score - a.score) // Sort by score descending

  return scoredProducts.slice(0, count).map((sp) => sp.product)
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: string): Product[] {
  const db = loadDatabase()
  return db.products.filter((p) => p.category === category)
}

/**
 * Get database configuration
 */
export function getDatabaseConfig(): ProductDatabase['config'] {
  const db = loadDatabase()
  return db.config
}
