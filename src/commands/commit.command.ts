import prompts from 'prompts';

import { CommandConfig, LocalDiff, LocalReviewArgs } from '../interfaces';
import { ConfigService } from '../services/config.service';
import { GitLocalService } from '../services/git/git-local.service';
import { FileService } from '../services/file.service';
import { logger } from '../logger';
import { OpenAiService } from '../services/openai.service';

import { BaseCommand } from './base.command';

export class CommitCommand extends BaseCommand<LocalReviewArgs> {
  constructor(config: CommandConfig) {
    super(config);
  }

  private async filesDiff(filenames: string[]): Promise<LocalDiff> {
    logger.info('Reviewing local changes for commit');
    return GitLocalService.getFilesDiff(filenames);
  }

  private async selectChangedFiles(): Promise<string[]> {
    const filenames = await GitLocalService.getFilesChanged();
    return FileService.selectFiles(filenames);
  }

  private async promptShouldCommit(): Promise<boolean> {
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message:
        'Do you want to commit the selected files with the generated commit message?',
      initial: false,
    });

    return response.value;
  }

  public async _run(): Promise<void> {
    const config = ConfigService.fromFile();
    const openAIConfig = config.llm.openai;

    const selectedFiles = await this.selectChangedFiles();
    const diff = await this.filesDiff(selectedFiles);

    logger.info('Generating commit message');

    const commitHistory = await GitLocalService.getCommitHistory();

    this.spinner.text = 'Generating commit message...';
    this.spinner.start();
    const commitMessage = await OpenAiService.generateCommitMessage(
      openAIConfig,
      diff,
      commitHistory,
    );
    this.spinner.stop();
    logger.info(commitMessage);

    const shouldCommit = await this.promptShouldCommit();
    if (shouldCommit) {
      await GitLocalService.commit(commitMessage, selectedFiles);
    }
  }
}
