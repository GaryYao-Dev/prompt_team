/**
 * File Saving Tool
 * Utility for saving HTML versions with versioning support
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Get the next version number for a file
 */
function getNextVersion(outputDir: string, baseFilename: string): number {
  if (!fs.existsSync(outputDir)) {
    return 1
  }

  const files = fs.readdirSync(outputDir)
  const pattern = new RegExp(`^${baseFilename}_v(\\d+)\\.html$`)

  let maxVersion = 0
  for (const file of files) {
    const match = file.match(pattern)
    if (match) {
      const version = parseInt(match[1], 10)
      if (version > maxVersion) {
        maxVersion = version
      }
    }
  }

  return maxVersion + 1
}

/**
 * Save HTML content to file with optional versioning
 */
export function saveHtmlToFile(
  outputDir: string,
  html: string,
  filename: string = 'email',
  createVersion: boolean = false
): { filepath: string; version?: number } {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  let finalFilename: string
  let version: number | undefined

  if (createVersion) {
    version = getNextVersion(outputDir, filename)
    finalFilename = `${filename}_v${version}.html`
  } else {
    finalFilename = `${filename}.html`
  }

  const filepath = path.join(outputDir, finalFilename)
  fs.writeFileSync(filepath, html, 'utf-8')

  return { filepath, version }
}

/**
 * Archive existing file by renaming to versioned name
 */
export function archiveExistingFile(
  outputDir: string,
  filename: string = 'email'
): { archived: boolean; newPath?: string } {
  const currentPath = path.join(outputDir, `${filename}.html`)

  if (!fs.existsSync(currentPath)) {
    return { archived: false }
  }

  const version = getNextVersion(outputDir, filename)
  const archivedFilename = `${filename}_v${version}.html`
  const archivedPath = path.join(outputDir, archivedFilename)

  fs.renameSync(currentPath, archivedPath)

  return { archived: true, newPath: archivedPath }
}

/**
 * LangChain tool for saving HTML files
 */
export const saveHtmlTool = tool(
  async ({ outputDir, html, filename, createVersion }) => {
    const result = saveHtmlToFile(outputDir, html, filename, createVersion)
    return JSON.stringify(result)
  },
  {
    name: 'save_html_file',
    description: 'Save HTML content to a file with optional versioning',
    schema: z.object({
      outputDir: z.string().describe('Output directory path'),
      html: z.string().describe('HTML content to save'),
      filename: z
        .string()
        .optional()
        .describe('Base filename (without extension)'),
      createVersion: z
        .boolean()
        .optional()
        .describe('Whether to create a versioned file'),
    }),
  }
)

/**
 * LangChain tool for archiving existing files
 */
export const archiveFileTool = tool(
  async ({ outputDir, filename }) => {
    const result = archiveExistingFile(outputDir, filename)
    return JSON.stringify(result)
  },
  {
    name: 'archive_file',
    description:
      'Archive an existing HTML file by renaming it to a versioned name',
    schema: z.object({
      outputDir: z.string().describe('Output directory path'),
      filename: z
        .string()
        .optional()
        .describe('Base filename (without extension)'),
    }),
  }
)

// Export all
export { getNextVersion }
