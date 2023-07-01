import { CommandConfig } from '../interfaces';
import { ConfigService } from '../services/config.service';
import { OpenAiService } from '../services/openai.service';
import { GithubService } from '../services/git/github.service';
import { logger } from '../logger';

import { BaseCommand } from './base.command';

interface PullRequestReviewArgs {
  fullRepository: string;
  pullRequest: string;
}

export class PullRequestReviewCommand extends BaseCommand<PullRequestReviewArgs> {
  constructor(config: CommandConfig) {
    super(config);
  }

  protected async _run({
    fullRepository,
    pullRequest,
  }: PullRequestReviewArgs): Promise<void> {
    const config = ConfigService.load();
    const openAIConfig = config.llm.openai;

    const pullRequestUrl = GithubService.getPullRequestUrl(
      fullRepository,
      pullRequest,
    );

    logger.info(`Reviewing ${pullRequestUrl}`);

    const pullRequestDiff = await GithubService.getPRDiff(
      config.github,
      config.git,
      fullRepository,
      pullRequest,
    );

    this.spinner.text = 'Reviewing...';
    this.spinner.start();
    const review = await OpenAiService.reviewDiff(
      openAIConfig,
      pullRequestDiff,
    );
    this.spinner.stop();

    logger.info(review);
  }
}
