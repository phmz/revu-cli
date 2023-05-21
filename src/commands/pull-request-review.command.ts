import { CommandConfig } from '../interfaces';
import { ConfigService } from '../services/config.service';
import { OpenAiService } from '../services/openai.service';
import { GithubService } from '../services/git/github.service';

import { BaseCommand } from './base.command';

interface PullRequestReviewArgs {
  fullRepository: string;
  pullRequest: string;
}

export class PullRequestReviewCommand extends BaseCommand<PullRequestReviewArgs> {
  constructor(config: CommandConfig) {
    super(config);
  }

  public async run({
    fullRepository,
    pullRequest,
  }: PullRequestReviewArgs): Promise<void> {
    const config = ConfigService.fromFile();
    const openAIConfig = config.llm.openai;

    const pullRequestDiff = await GithubService.getPRDiff(
      config.github,
      fullRepository,
      pullRequest,
    );

    const review = await OpenAiService.reviewCode(
      openAIConfig,
      pullRequestDiff,
    );

    console.log(review);
  }
}
