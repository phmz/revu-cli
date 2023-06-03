import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateChatCompletionRequest,
  OpenAIApi,
} from 'openai';

import { GitDiff, OpenAIConfig } from '../interfaces';

import { PromptService } from './prompt.service';

export class OpenAiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAiServiceError';
  }
}

export class OpenAiService {
  public static async callOpenAI(
    config: OpenAIConfig,
    messages: ChatCompletionRequestMessage[],
  ): Promise<string> {
    const openAIConfiguration = new Configuration({
      apiKey: config.secretOpenaiApiKey,
    });
    const openaiClient = new OpenAIApi(openAIConfiguration);

    const chatCompletionCreate: CreateChatCompletionRequest = {
      model: config.openaiModel,
      temperature: config.openaiTemperature,
      messages: messages,
    };

    let result;
    try {
      result = await openaiClient.createChatCompletion(chatCompletionCreate);
    } catch (error: any) {
      throw new OpenAiServiceError(
        `Failed to call OpenAI API: ${error.message}`,
      );
    }

    const assistantMessage = result.data?.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new OpenAiServiceError('OpenAI did not return a response');
    }

    return assistantMessage;
  }

  public static async reviewDiff(
    config: OpenAIConfig,
    details: GitDiff,
  ): Promise<string> {
    const prompt = PromptService.generateReviewDiffPrompt(details);
    const messages: ChatCompletionRequestMessage[] = [
      {
        role: 'system',
        content: prompt.system,
      },
      {
        role: 'user',
        content: prompt.user,
      },
    ];

    return await this.callOpenAI(config, messages);
  }

  public static async generateCommitMessage(
    config: OpenAIConfig,
    details: GitDiff,
    commitHistory: string[],
  ): Promise<string> {
    const prompt = PromptService.generateCommitMessagePrompt(
      details,
      commitHistory,
    );
    const messages: ChatCompletionRequestMessage[] = [
      {
        role: 'system',
        content: prompt.system,
      },
      {
        role: 'user',
        content: prompt.user,
      },
    ];

    return await this.callOpenAI(config, messages);
  }
}
