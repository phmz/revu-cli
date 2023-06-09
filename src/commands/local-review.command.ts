import {
  CommandConfig,
  GitConfig,
  LocalReviewArgs,
  OpenAIConfig,
} from '../interfaces';
import { ConfigService } from '../services/config.service';
import { OpenAiService } from '../services/openai.service';
import { GitLocalService } from '../services/git/git-local.service';
import { FileService } from '../services/file.service';
import { logger } from '../logger';

import { BaseCommand } from './base.command';

export class LocalReviewCommand extends BaseCommand<LocalReviewArgs> {
  constructor(config: CommandConfig) {
    super(config);
  }

  private async reviewDiff(
    openAIConfig: OpenAIConfig,
    gitConfig: GitConfig,
  ): Promise<string> {
    const localDiff = await GitLocalService.getLocalDiff({
      ignorePatterns: gitConfig.ignorePatterns,
    });
    logger.info('Reviewing local changes');

    this.spinner.start();
    return OpenAiService.reviewDiff(openAIConfig, localDiff);
  }

  private async reviewFile(
    openAIConfig: OpenAIConfig,
    directory: string,
    filename: string,
  ): Promise<string> {
    const getFileResponse = await FileService.getFileContentAndName(
      directory,
      filename,
    );
    const contentWithLineNumbers = FileService.addLineNumbers(
      getFileResponse.content,
    );

    logger.info(`Reviewing ${getFileResponse.filename}`);

    this.spinner.start();
    return OpenAiService.reviewFile(
      openAIConfig,
      contentWithLineNumbers,
      getFileResponse.filename,
    );
  }

  protected async _run({
    directory,
    filename,
  }: LocalReviewArgs): Promise<void> {
    const config = ConfigService.load();
    const openAIConfig = config.llm.openai;
    const gitConfig = config.git;

    this.spinner.text = 'Reviewing...';
    const review = filename
      ? await this.reviewFile(openAIConfig, directory, filename)
      : await this.reviewDiff(openAIConfig, gitConfig);
    this.spinner.stop();

    logger.info(review);
  }
}
