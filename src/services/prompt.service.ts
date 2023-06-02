import { LocalDiff, Prompt } from '../interfaces';

export class PromptService {
  public static generateCodeReviewPrompt(details: LocalDiff): Prompt {
    const context = `You are a highly experienced assistant that reviews code.\
    \nYour task is to ensure the code follows the best practices efficient, maintainable, and secure.`;
    const instructions = `IMPORTANT INSTRUCTIONS (Mandatory):
    - Always pinpoint exactly where in the code needs adjustment and precisely what needs to be changed.
    - Ensure that the review is as concise and specific as possible.
    - Never recommend changes that do not enhance or fixe the code.
    - Never recommend comments.
    - Never include comments that do not contribute to the code's improvement or error correction.
    - Always explicitly mention at the end the overall status, either "✔ LGTM", "✘ Change(s) required", or "~ LGTM with suggestions".`;
    const responseFormat = `\`\`\`\n📌 {{filename}}\n💡 {{suggestion}}\n\`\`\``;
    const systemContent = `${context}\n${instructions}\n${responseFormat}`;

    return {
      system: systemContent,
      user: `Please review the following code changes:\n\`\`\`\n${details.diff}\n\`\`\``,
    };
  }

  public static generateCommitMessagePrompt(
    details: LocalDiff,
    commitHistory: string[],
  ): Prompt {
    const context = `You are a highly experienced assistant that reviews code.\
    \nYour task is to find the perfect commit description using the diff and the commit history if provided.\
    ${
      commitHistory.length > 0
        ? `\nThe commit history is:\n\`\`\`\n${commitHistory.join(
            '\n',
          )}\n\`\`\``
        : ''
    }`;
    const instructions = `IMPORTANT INSTRUCTIONS (Mandatory):
    - The response should only contain the commit description.
    - The commit short description should have a maximum length of 40 characters.`;
    const systemContent = `${context}\n${instructions}`;

    return {
      system: systemContent,
      user: `Please generate the perfect commit description for the following code changes:\n\`\`\`\n${details.diff}\n\`\`\``,
    };
  }
}
