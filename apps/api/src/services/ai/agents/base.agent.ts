/**
 * Base Agent Abstract Class
 * Following Single Responsibility and Open/Closed Principles
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { BaseMessage } from '@langchain/core/messages'
import { SystemMessage } from '@langchain/core/messages'
import type { AgentConfig, AgentRole } from './types'

/**
 * Abstract base class for all agents in the promotion team.
 * Provides common functionality while allowing role-specific implementations.
 */
export abstract class BaseAgent {
  protected readonly role: AgentRole
  protected readonly systemPrompt: string
  protected readonly llm: BaseChatModel

  constructor(llm: BaseChatModel, config: AgentConfig) {
    this.role = config.role
    this.systemPrompt = config.systemPrompt
    this.llm = llm
  }

  /**
   * Get the agent's role
   */
  getRole(): AgentRole {
    return this.role
  }

  /**
   * Invoke the agent with messages and return response
   */
  async invoke(messages: BaseMessage[]): Promise<BaseMessage> {
    const messagesWithSystem = [
      new SystemMessage(this.systemPrompt),
      ...messages,
    ]
    const response = await this.llm.invoke(messagesWithSystem)

    // Log response for debugging
    const content =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content)
    console.log(`[${this.role}] LLM response length: ${content.length} chars`)

    return response
  }

  /**
   * Parse structured output from LLM response
   * Subclasses can override for specific parsing logic
   */
  protected parseResponse<T>(content: string): T {
    // Handle empty or undefined content
    if (!content || content.trim() === '') {
      throw new Error(
        `[${this.role}] LLM returned empty response. This may be due to rate limiting or timeout.`
      )
    }

    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      let jsonContent = jsonMatch ? jsonMatch[1].trim() : content

      // Remove trailing commas before ] or } (common LLM output issue)
      jsonContent = jsonContent.replace(/,(\s*[}\]])/g, '$1')

      return JSON.parse(jsonContent) as T
    } catch (parseError) {
      console.error(
        `[${this.role}] Failed to parse response:`,
        content.slice(0, 500)
      )
      throw new Error(
        `Failed to parse agent response: ${content.slice(0, 200)}...`
      )
    }
  }
}
