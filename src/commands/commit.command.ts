import prompts from 'prompts';

import {
  CommandConfig,
  CommitAction,
  FileSelectionStatus,
  GitConfig,
  GitDiff,
  LocalReviewArgs,
} from '../interfaces';
import { ConfigService } from '../services/config.service';
import { GitLocalService } from '../services/git/git-local.service';
import { FileService } from '../services/file.service';
import { logger } from '../logger';
import { OpenAiService } from '../services/openai.service';

import { BaseCommand } from './base.command';

class CommitCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommitCommandError';
  }
}

export class CommitCommand extends BaseCommand<LocalReviewArgs> {
  constructor(config: CommandConfig) {
    super(config);
  }

  private async filesDiff(
    filenames: string[],
    gitConfig: GitConfig,
  ): Promise<GitDiff> {
    logger.info('Reviewing local changes for commit');
    return GitLocalService.getFilesDiff(filenames, {
      ignorePatterns: gitConfig.ignorePatterns,
    });
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

  private async promptShouldContinueCommit(): Promise<boolean> {
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message: 'Do you want to continue commit?',
      initial: false,
    });

    return response.value;
  }

  private async getCommitAction(): Promise<CommitAction> {
    const response = await prompts({
      type: 'select',
      name: 'value',
      message: 'Do you want to commit the message, replace it, or do nothing?',
      choices: [
        { title: 'Commit', value: CommitAction.COMMIT },
        { title: 'Replace', value: CommitAction.REPLACE },
        { title: 'Do Nothing', value: CommitAction.SKIP },
      ],
      initial: 0,
    });

    if (!response.value) {
      throw new CommitCommandError('Commit action is required');
    }

    return response.value;
  }

  private async promptReplaceCommitMessage(
    initialMessage: string,
  ): Promise<string> {
    const response = await prompts({
      type: 'text',
      name: 'value',
      message: 'Enter the new commit message:',
      initial: initialMessage,
    });

    if (!response.value) {
      throw new CommitCommandError('Commit message is required');
    }

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
      const diff = await this.filesDiff(selectedFileNames, gitConfig);

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

      const commitAction = await this.getCommitAction();

      shouldContinueCommit = commitAction !== CommitAction.SKIP;

      if (commitAction !== CommitAction.SKIP) {
        const messageToCommit =
          commitAction === CommitAction.COMMIT
            ? commitMessage
            : await this.promptReplaceCommitMessage(commitMessage);
        await GitLocalService.commit(messageToCommit, selectedFileNames);

        shouldContinueCommit =
          unselectedFileNames.length === 0
            ? false
            : await this.promptShouldContinueCommit();
      }
    }
  }
}
