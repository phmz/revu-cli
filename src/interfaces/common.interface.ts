import { GitConfig } from './git.interface';
import { GithubConfig } from './github.interface';
import { LLMConfig } from './llm.interface';

export interface Config {
  git: GitConfig;
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
