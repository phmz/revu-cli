import { CommandConfig, LocalDiff, LocalReviewArgs } from '../interfaces';
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

  private async localDiff(): Promise<LocalDiff> {
    logger.info('Reviewing local changes');
    return GitLocalService.getLocalDiff();
  }

  private async localFile(
    directory: string,
    filename: string,
  ): Promise<LocalDiff> {
    const { content, filename: selectedFile } =
      await FileService.getFileContentAndName(directory, filename);
    logger.info(`Reviewing ${selectedFile}`);
    return { diff: content };
  }

  public async run({ directory, filename }: LocalReviewArgs): Promise<void> {
    const config = ConfigService.fromFile();
    const openAIConfig = config.llm.openai;

    const localDiff = filename
      ? await this.localFile(directory, filename)
      : await this.localDiff();

    const review = await OpenAiService.reviewCode(openAIConfig, localDiff);

    logger.info(review);
  }
}
