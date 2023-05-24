export interface GithubConfig {
  githubApiUrl: string;
  secretGithubToken: string;
}

export interface OpenAIConfig {
  openaiApiUrl: string;
  openaiModel: string;
  openaiTemperature: number;
  secretOpenaiApiKey: string;
}

export interface LLMConfig {
  openai: OpenAIConfig;
}

export interface Config {
  github: GithubConfig;
  llm: LLMConfig;
}

export interface CommandConfig {
  commandName: string;
}

export interface LocalDiff {
  diff: string;
}

export interface PullRequestDiff {
  diff: string;
}

export interface LocalReviewArgs {
  directory: string;
  filename: string;
}

export interface Prompt {
  system: string;
  user: string;
}

export interface FileSelectionStatus {
  selectedFileNames: string[];
  unselectedFileNames: string[];
}
