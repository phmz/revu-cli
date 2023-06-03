import { GitDiff, Prompt } from '../interfaces';

export class PromptService {
  public static generateReviewDiffPrompt(details: GitDiff): Prompt {
    const context =
      'Your objective is to meticulously review a diff from a git repository and ' +
      'meticulously identify any requisite alterations to guarantee that the code ' +
      'is efficient, durable, and secure. Your assessment must be precise and detailed, ' +
      'only proposing changes that will enhance or repair the code. It is imperative to ' +
      'accurately pinpoint the exact location in the code that necessitates modification ' +
      'and explicitly specify the necessary changes. Refrain from suggesting comments and ' +
      'provide an overall status at the conclusion of your evaluation. If no changes are necessary, ' +
      'state "✔ LGTM." at the end of your feedback. If modifications are required, state ' +
      '"✘ Change(s) required." at the end of your feedback. If you have suggestions, state ' +
      '"~ LGTM with suggestions." at the end of your feedback. When recommending modifications or ' +
      'improvements, please adhere to the following format:';
    const responseFormat = `📌 {{filename}}\n💡 {{suggestion}}`;
    const systemContent = `${context}\n\n${responseFormat}`;

    return {
      system: systemContent,
      user: `Please review the following code changes:\n\`\`\`\n${details.diff}\n\`\`\``,
    };
  }

  public static generateReviewFilePrompt(
    fileContent: string,
    filename: string,
  ): Prompt {
    const context =
      'As an expert code reviewer, your main duty is to ensure that the code conforms to ' +
      'the highest standards of efficiency, maintainability, and security. To accomplish this, ' +
      'you must provide clear and precise feedback that identifies the exact line number where ' +
      'changes are necessary and specifies what needs to be altered. It is crucial to avoid suggesting ' +
      'modifications that do not improve or fix the code and to refrain from making comments that do not ' +
      "contribute to the code's improvement or error correction. At the conclusion of your review, you " +
      'must explicitly state the overall status of the code, using one of the following three options: ' +
      '"✔ LGTM" for code that is ready for use, "✘ Change(s) required" for code that requires improvements, ' +
      'or "~ LGTM with suggestions" for code that is mostly acceptable but could benefit from some minor adjustments.';
    const responseFormat = `Your feedback should be formatted in the following way:\n\n💡 Line {{line number}}: {{suggestion}}`;
    const systemContent = `${context}\n\n${responseFormat}`;

    const fileExtension = filename.slice(filename.lastIndexOf('.') + 1);

    return {
      system: systemContent,
      user: `Please review the following file:\n\`\`\`${fileExtension}\n${fileContent}\n\`\`\``,
    };
  }

  public static generateCommitMessagePrompt(
    details: GitDiff,
    commitHistory: string[],
  ): Prompt {
    const context =
      'As an experienced code reviewer, your task is to identify the most appropriate commit ' +
      'description by analyzing the diff and commit history. Your objective is ' +
      'to produce a concise and precise commit description with a maximum length of 40 characters. ' +
      'Please note that your response should only include the commit description. The commit history ' +
      'provided is as follows:';
    const commitHistoryContent = `\`\`\`\n${commitHistory.join('\n')}\n\`\`\``;
    const systemContent = `${context}\n${commitHistoryContent}`;

    return {
      system: systemContent,
      user: `Please generate the perfect commit description for the following code changes:\n\`\`\`\n${details.diff}\n\`\`\``,
    };
  }
}
