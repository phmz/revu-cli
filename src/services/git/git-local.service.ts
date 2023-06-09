import { gitP } from 'simple-git';

import { GitFileChange, GitDiff } from '../../interfaces';

class GitLocalServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitLocalServiceError';
  }
}

export class GitLocalService {
  private static readonly git = gitP();

  public static async getLocalDiff(options?: {
    ignorePatterns?: string[];
  }): Promise<GitDiff> {
    const fileChanges = await this.getFilesChanged();
    const filenames = fileChanges.map((fileChange) => fileChange.filename);

    return this.getFilesDiff(filenames, {
      ignorePatterns: options?.ignorePatterns,
    });
  }

  public static async getFilesChanged(): Promise<GitFileChange[]> {
    await this.checkIsRepo();

    const status = await this.git.status();

    const added: GitFileChange[] = [...status.created, ...status.not_added].map(
      (filename) => ({ filename, status: 'added' }),
    );

    const deleted: GitFileChange[] = status.deleted.map((filename) => ({
      filename,
      status: 'deleted',
    }));

    const changed: GitFileChange[] = [
      ...status.modified,
      ...status.renamed.map((renamed) => renamed.to),
      ...status.conflicted,
    ].map((filename) => ({ filename, status: 'changed' }));

    return [...added, ...deleted, ...changed].sort((a, b) => {
      return a.filename.localeCompare(b.filename);
    });
  }

  public static async getFilesDiff(
    filenames: string[],
    options?: { ignorePatterns?: string[] },
  ): Promise<GitDiff> {
    await this.checkIsRepo();

    const ignorePatterns =
      options?.ignorePatterns?.map((pattern) => new RegExp(pattern)) || [];

    const filteredFilenames = filenames.filter((filename) => {
      return !ignorePatterns.some((pattern) => pattern.test(filename));
    });

    if (filteredFilenames.length === 0) {
      throw new GitLocalServiceError('No files to diff');
    }

    const diff = await this.git.diff(['HEAD', '--'].concat(filteredFilenames));

    return { diff };
  }

  public static async getCommitHistory(
    maxCommitHistory: number,
  ): Promise<string[]> {
    await this.checkIsRepo();

    const history = await this.git.log([
      '-n',
      String(maxCommitHistory),
      '--pretty=format:%s',
    ]);
    return history.all
      .map((commit) => {
        return commit.hash;
      })
      .map((commits) => {
        return commits.split('\n');
      })
      .flat();
  }

  public static async commit(
    message: string,
    filenames: string[],
  ): Promise<void> {
    await this.checkIsRepo();

    await this.git.add(filenames);
    await this.git.commit(message);
  }

  private static async checkIsRepo(): Promise<void> {
    if (!(await this.git.checkIsRepo())) {
      throw new GitLocalServiceError(
        'Current directory is not inside a Git repository.',
      );
    }
  }
}
