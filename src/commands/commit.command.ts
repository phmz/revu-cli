import prompts from 'prompts';

import {
  CommandConfig,
  FileSelectionStatus,
  GitDiff,
  LocalReviewArgs,
} from '../interfaces';
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

  private async filesDiff(filenames: string[]): Promise<GitDiff> {
    logger.info('Reviewing local changes for commit');
    return GitLocalService.getFilesDiff(filenames);
  }

  private async selectChangedFiles(): Promise<FileSelectionStatus> {
    const fileChanges = await GitLocalService.getFilesChanged();
    const selectedFiles = await FileService.selectFiles(fileChanges);

    const selectedFileNames = new Set(
      selectedFiles.map((file) => file.filename),
    );
    const allFileNames = fileChanges.map((fileChange) => fileChange.filename);

    const unselectedFileNames = allFileNames.filter(
      (filename) => !selectedFileNames.has(filename),
    );

    return {
      selectedFileNames: Array.from(selectedFileNames),
      unselectedFileNames: unselectedFileNames,
    };
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

  private async promptShouldContinueCommit(): Promise<boolean> {
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message: 'Do you want to continue commit?',
      initial: false,
    });

    return response.value;
  }

  protected async _run(): Promise<void> {
    let shouldContinueCommit = true;
    const config = ConfigService.load();
    const gitConfig = config.git;
    const openAIConfig = config.llm.openai;

    while (shouldContinueCommit) {
      const { selectedFileNames, unselectedFileNames } =
        await this.selectChangedFiles();
      const diff = await this.filesDiff(selectedFileNames);

      logger.info('Generating commit message');

      const commitHistory = await GitLocalService.getCommitHistory(
        gitConfig.maxCommitHistory,
      );

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
        await GitLocalService.commit(commitMessage, selectedFileNames);
        shouldContinueCommit =
          unselectedFileNames.length === 0
            ? false
            : await this.promptShouldContinueCommit();
      } else {
        shouldContinueCommit = false;
      }
    }
  }
}
