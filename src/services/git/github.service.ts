import fetch from 'node-fetch';

import { GithubConfig, PullRequestDiff } from '../../interfaces';

class GithubServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GithubServiceError';
  }
}

export class GithubService {
  private static getOwnerAndRepo(fullRepositoryPath: string): {
    owner: string;
    repo: string;
  } {
    const ownerRepoRegex = /^[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+$/;
    if (!ownerRepoRegex.test(fullRepositoryPath)) {
      throw new GithubServiceError(
        'Invalid repository format. Please use the format: owner/repo',
      );
    }
    const [owner, repo] = fullRepositoryPath.split('/');

    return { owner, repo };
  }
  static async getPRDiff(
    config: GithubConfig,
    fullRepositoryPath: string,
    prNumber: string,
  ): Promise<PullRequestDiff> {
    const { owner, repo } = this.getOwnerAndRepo(fullRepositoryPath);
    const apiPrUrl = `${config.githubApiUrl}/repos/${owner}/${repo}/pulls/${prNumber}`;

    const diffResponse = await fetch(apiPrUrl, {
      headers: {
        Authorization: `Bearer ${config.secretGithubToken}`,
        'User-Agent': 'Raven-CLI',
        Accept: 'application/vnd.github.diff',
      },
    });

    if (!diffResponse.ok) {
      throw new GithubServiceError(
        `Failed to fetch PR diff: ${diffResponse.statusText}`,
      );
    }

    const diff = await diffResponse.text();

    return { diff };
  }
}
