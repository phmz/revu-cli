import fs from 'fs';
import path from 'path';
import os from 'os';

import merge from 'lodash.merge';

import { Config } from '../interfaces';

const CONFIG_FILENAME = 'revu.json';

const DEFAULT_CONFIG: Config = {
  git: {
    ignorePatterns: [],
    maxCommitHistory: 10,
  },
  github: {
    githubApiUrl: 'https://api.github.com',
    secretGithubToken: '',
  },
  llm: {
    openai: {
      openaiApiUrl: 'https://api.openai.com',
      openaiModel: 'gpt-3.5-turbo',
      openaiTemperature: 0,
      secretOpenaiApiKey: '',
    },
  },
};

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ConfigService {
  private static getConfigPath(): string {
    const configDir =
      process.env.NODE_ENV === 'development'
        ? process.cwd()
        : path.join(os.homedir(), '.revu');
    return path.join(configDir, CONFIG_FILENAME);
  }

  private static fromEnvOrDefault(): Config {
    const envConfig = {
      git: {
        ignorePatterns: process.env.GIT_IGNORE_PATTERNS?.split(','),
        maxCommitHistory: process.env.GIT_MAX_COMMIT_HISTORY
          ? Number(process.env.GIT_MAX_COMMIT_HISTORY)
          : undefined,
      },
      github: {
        githubApiUrl: process.env.GITHUB_API_URL,
        secretGithubToken: process.env.GITHUB_TOKEN,
      },
      llm: {
        openai: {
          openaiApiUrl: process.env.OPENAI_API_URL,
          openaiModel: process.env.OPENAI_MODEL,
          openaiTemperature: process.env.OPENAI_TEMPERATURE
            ? Number(process.env.OPENAI_TEMPERATURE)
            : undefined,
          secretOpenaiApiKey: process.env.OPENAI_API_KEY,
        },
      },
    } as Config;

    const cleanedEnvConfig = JSON.parse(JSON.stringify(envConfig));

    return merge({}, DEFAULT_CONFIG, cleanedEnvConfig);
  }

  static fromFileOrDefault(): Config {
    let fileConfig = {} as Config;
    if (this.configFileExists()) {
      try {
        fileConfig = JSON.parse(fs.readFileSync(this.getConfigPath(), 'utf-8'));
      } catch (err) {
        throw new ConfigurationError(
          'Unable to parse the configuration file. Please ensure it is valid JSON.',
        );
      }
    }

    return merge({}, DEFAULT_CONFIG, fileConfig);
  }

  private static validateTemperature(temperature: number): void {
    if (!(temperature >= 0.0 && temperature <= 2.0)) {
      throw new ConfigurationError(
        'Invalid temperature value. It must be a value between 0 and 2 (inclusive).',
      );
    }
  }

  private static configFileExists(): boolean {
    const configPath = this.getConfigPath();
    return fs.existsSync(configPath);
  }

  static save({
    githubToken,
    openaiApiKey,
  }: {
    githubToken: string;
    openaiApiKey: string;
  }): void {
    const configPath = this.getConfigPath();
    const dir = path.dirname(configPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const config = this.fromFileOrDefault();

    config.github.secretGithubToken = githubToken;
    config.llm.openai.secretOpenaiApiKey = openaiApiKey;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  static load(): Config {
    const config = this.configFileExists()
      ? this.fromFileOrDefault()
      : this.fromEnvOrDefault();

    this.validateTemperature(config.llm.openai.openaiTemperature);

    return config;
  }
}
