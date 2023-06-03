import { CommandConfig, LocalReviewArgs, OpenAIConfig } from '../interfaces';
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

  private async reviewDiff(openAIConfig: OpenAIConfig): Promise<string> {
    const localDiff = await GitLocalService.getLocalDiff();
    logger.info('Reviewing local changes');

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
    const config = ConfigService.fromFile();
    const openAIConfig = config.llm.openai;

    this.spinner.text = 'Reviewing...';
    this.spinner.start();
    const review = filename
      ? await this.reviewFile(openAIConfig, directory, filename)
      : await this.reviewDiff(openAIConfig);
    this.spinner.stop();

    logger.info(review);
  }
}
