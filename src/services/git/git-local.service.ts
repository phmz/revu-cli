import { gitP } from 'simple-git';

import { LocalDiff } from '../../interfaces';

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
}
