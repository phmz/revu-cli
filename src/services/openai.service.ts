import { Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai';

import { LocalDiff, OpenAIConfig } from '../interfaces';

export class OpenAiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAiServiceError';
  }
}

export class OpenAiService {
  public static async reviewCode(
    config: OpenAIConfig,
    details: LocalDiff,
  ): Promise<string> {
    const openAIConfiguration = new Configuration({
      apiKey: config.secretOpenaiApiKey,
    });
    const openaiClient = new OpenAIApi(openAIConfiguration);

    const context = `You are a highly experienced assistant that reviews code.\
    \nYour task is to ensure the code follows the best practices efficient, maintainable, and secure.`;
    const instructions = `IMPORTANT INSTRUCTIONS (Mandatory):
    - Always pinpoint exactly where in the code needs adjustment and precisely what needs to be changed.
    - Ensure that the review is as concise and specific as possible.
    - Never recommend changes that do not enhance or fixe the code.
    - Never recommend comments.
    - Never include comments that do not contribute to the code's improvement or error correction.
    - Always explicitly mention at the end the overall status, either "✔ LGTM", "✘ Change(s) required", or "~ LGTM with suggestions".`;
    const responseFormat = `\`\`\`\
    \n📌 {{filename}}\
    \n💡 {{suggestion}}\
    \n\`\`\``;
    const systemContent = `${context}\n${instructions}\n${responseFormat}`;

    const chatCompletionCreate: CreateChatCompletionRequest = {
      model: config.openaiModel,
      temperature: config.openaiTemperature,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content: `Please review the following code changes:\n\n${details.diff}`,
        },
      ],
    };

    let result;
    try {
      result = await openaiClient.createChatCompletion(chatCompletionCreate);
    } catch (error: any) {
      throw new OpenAiServiceError(`Failed to review code: ${error.message}`);
    }

    const assistantMessage = result.data?.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new OpenAiServiceError('OpenAI did not return a response');
    }

    return assistantMessage;
  }

  public static async generateCommitMessage(
    config: OpenAIConfig,
    details: LocalDiff,
    commitHistory: string[],
  ): Promise<string> {
    const openAIConfiguration = new Configuration({
      apiKey: config.secretOpenaiApiKey,
    });
    const openaiClient = new OpenAIApi(openAIConfiguration);

    const context = `You are a highly experienced assistant that reviews code.\
    \nYour task is to find the perfect commit description using the diff and the commit history if provided.\
    ${
      commitHistory.length > 0
        ? `\n\nThe commit history is:\n\n${commitHistory.join('\n')}`
        : ''
    }`;
    const instructions = `IMPORTANT INSTRUCTIONS (Mandatory):
    - The response should only contain the commit description.`;
    const systemContent = `${context}\n${instructions}`;

    const chatCompletionCreate: CreateChatCompletionRequest = {
      model: config.openaiModel,
      temperature: config.openaiTemperature,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content: `Please provide the perfect commit description:\n\n${details.diff}`,
        },
      ],
    };

    let result;
    try {
      result = await openaiClient.createChatCompletion(chatCompletionCreate);
    } catch (error: any) {
      throw new OpenAiServiceError(
        `Failed to generate the commit message: ${error.message}`,
      );
    }

    const assistantMessage = result.data?.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new OpenAiServiceError('OpenAI did not return a response');
    }

    return assistantMessage;
  }
}
