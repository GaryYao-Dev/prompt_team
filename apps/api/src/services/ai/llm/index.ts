import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'

// Supported Models
export const OPENAI_MODELS = [
  'gpt-4o-mini',
  'gpt-5-mini',
  'gpt-5.1',
  'gpt-5-nano',
] as const
export type OpenAIModel = (typeof OPENAI_MODELS)[number]

export const ANTHROPIC_MODELS = [
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
] as const
export type AnthropicModel = (typeof ANTHROPIC_MODELS)[number]

export const GOOGLE_MODELS = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
] as const
export type GoogleModel = (typeof GOOGLE_MODELS)[number]

// LLM provider types
export type LLMProvider = 'openai' | 'anthropic' | 'google'

// Base configuration
interface BaseLLMConfig {
  temperature?: number
  maxTokens?: number
  apiKey?: string
  timeout?: number // Timeout in milliseconds
}

// Provider-specific configurations
export interface OpenAIConfig extends BaseLLMConfig {
  provider: 'openai'
  model: OpenAIModel
}

export interface AnthropicConfig extends BaseLLMConfig {
  provider: 'anthropic'
  model: AnthropicModel
}

export interface GoogleConfig extends BaseLLMConfig {
  provider: 'google'
  model: GoogleModel
}

// Union configuration type
export type LLMConfig = OpenAIConfig | AnthropicConfig | GoogleConfig

// Default configurations
const DEFAULT_CONFIGS: {
  openai: Omit<OpenAIConfig, 'provider'>
  anthropic: Omit<AnthropicConfig, 'provider'>
  google: Omit<GoogleConfig, 'provider'>
} = {
  openai: {
    model: 'gpt-4o-mini',
    // temperature: 0.7,
    // maxTokens: 20000,
    timeout: 30000,
  },
  anthropic: {
    model: 'claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 2000,
  },
  google: {
    model: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 2000,
  },
}

/**
 * Create an LLM instance based on the provided configuration.
 */
export function createLLM(config: LLMConfig): BaseChatModel {
  // We strictly type the default config retrieval
  const defaultConfig = DEFAULT_CONFIGS[config.provider] as Partial<LLMConfig>
  const fullConfig = { ...defaultConfig, ...config }

  switch (config.provider) {
    case 'openai':
      return new ChatOpenAI({
        openAIApiKey: fullConfig.apiKey || process.env.OPENAI_API_KEY,
        modelName: fullConfig.model,
        temperature: fullConfig.temperature,
        maxTokens: fullConfig.maxTokens,
        timeout: fullConfig.timeout,
      })

    case 'anthropic':
      return new ChatAnthropic({
        anthropicApiKey: fullConfig.apiKey || process.env.ANTHROPIC_API_KEY,
        modelName: fullConfig.model,
        temperature: fullConfig.temperature,
        maxTokens: fullConfig.maxTokens,
      })

    case 'google':
      return new ChatGoogleGenerativeAI({
        apiKey: fullConfig.apiKey || process.env.GOOGLE_API_KEY,
        model: fullConfig.model,
        temperature: fullConfig.temperature,
        maxOutputTokens: fullConfig.maxTokens,
      })

    default:
      // This case should be unreachable if types are correct
      const _exhaustiveCheck: never = config
      throw new Error(`Unsupported LLM provider: ${(config as any).provider}`)
  }
}

/**
 * Get a default LLM instance using environment configuration.
 */
export function getDefaultLLM(): BaseChatModel {
  const provider = (process.env.DEFAULT_LLM_PROVIDER as LLMProvider) || 'openai'
  const defaults = DEFAULT_CONFIGS[provider]

  // Construct a valid config object
  // We explicitly construct the config to match LLMConfig union
  const config = {
    provider,
    ...defaults,
  } as LLMConfig

  return createLLM(config)
}
