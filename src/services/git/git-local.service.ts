import { gitP } from 'simple-git';

import { LocalDiff } from '../../interfaces';

const MAX_COMMIT_HISTORY = 20;

class GitLocalServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitLocalServiceError';
  }
}

export class GitLocalService {
  private static readonly git = gitP();

  public static async getLocalDiff(): Promise<LocalDiff> {
    if (!(await this.git.checkIsRepo())) {
      throw new GitLocalServiceError(
        'Current directory is not inside a Git repository.',
      );
    }

    const diff = await this.git.diff(['HEAD']);
    return { diff };
  }

  public static async getFilesChanged(): Promise<string[]> {
    if (!(await this.git.checkIsRepo())) {
      throw new GitLocalServiceError(
        'Current directory is not inside a Git repository.',
      );
    }

    const diff = await this.git.diff(['HEAD', '--name-only']);
    return diff.split('\n').filter(Boolean);
  }

  public static async getFilesDiff(filenames: string[]): Promise<LocalDiff> {
    if (!(await this.git.checkIsRepo())) {
      throw new GitLocalServiceError(
        'Current directory is not inside a Git repository.',
      );
    }

    const diff = await this.git.diff(['HEAD'].concat(filenames));
    return { diff };
  }

  public static async getCommitHistory(): Promise<string[]> {
    if (!(await this.git.checkIsRepo())) {
      throw new GitLocalServiceError(
        'Current directory is not inside a Git repository.',
      );
    }

    const history = await this.git.log([
      '-n',
      String(MAX_COMMIT_HISTORY),
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
}
