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

export interface RunArgs<T> {
  args: T;
}

export interface LocalDiff {
  diff: string;
}

export interface PullRequestDiff {
  diff: string;
}
