export interface GithubConfig {
  githubApiUrl: string;
  secretGithubToken: string;
}

export interface GitHubRepository {
  owner: string;
  repo: string;
}
