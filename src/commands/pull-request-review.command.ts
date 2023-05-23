import ora from 'ora';

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

  public async run({
    fullRepository,
    pullRequest,
  }: PullRequestReviewArgs): Promise<void> {
    const config = ConfigService.fromFile();
    const openAIConfig = config.llm.openai;

    const pullRequestUrl = GithubService.getPullRequestUrl(
      fullRepository,
      pullRequest,
    );

    logger.info(`Reviewing ${pullRequestUrl}`);

    const pullRequestDiff = await GithubService.getPRDiff(
      config.github,
      fullRepository,
      pullRequest,
    );

    const spinner = ora({
      text: 'Reviewing...',
    }).start();
    const review = await OpenAiService.reviewCode(
      openAIConfig,
      pullRequestDiff,
    );
    spinner.stop();

    logger.info(review);
  }
}
