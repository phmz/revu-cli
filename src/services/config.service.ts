import fs from 'fs';
import path from 'path';
import os from 'os';

import { Config, GithubConfig, OpenAIConfig } from '../interfaces';

const CONFIG_FILENAME = 'rvn.json';

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
        : path.join(os.homedir(), '.rvn');
    return path.join(configDir, CONFIG_FILENAME);
  }

  private static getDefaultGithubConfig(): GithubConfig {
    return {
      secretGithubToken: 'ght_<your_token_here>',
      githubApiUrl: 'https://api.github.com',
    };
  }

  private static getDefaultOpenAIConfig(): OpenAIConfig {
    return {
      secretOpenaiApiKey: 'sk-<your_key_here>',
      openaiTemperature: 0,
      openaiApiUrl: 'https://api.openai.com',
      openaiModel: 'gpt-3.5-turbo',
    };
  }

  private static validateTemperature(temperature: number): void {
    if (!(temperature >= 0.0 && temperature <= 2.0)) {
      throw new ConfigurationError(
        'Invalid temperature value. It must be a value between 0 and 2 (inclusive).',
      );
    }
  }

  static newConfig({
    githubToken,
    openaiApiKey,
  }: {
    githubToken: string;
    openaiApiKey: string;
  }): Config {
    return {
      github: {
        ...ConfigService.getDefaultGithubConfig(),
        secretGithubToken: githubToken,
      },
      llm: {
        openai: {
          ...ConfigService.getDefaultOpenAIConfig(),
          secretOpenaiApiKey: openaiApiKey,
        },
      },
    };
  }

  static fromFile(): Config {
    const configPath = ConfigService.getConfigPath();
    if (!fs.existsSync(configPath)) {
      throw new ConfigurationError(
        `Configuration file ${configPath} not found. Please run the config command.`,
      );
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const config: Config = JSON.parse(content);

    ConfigService.validateTemperature(config.llm.openai.openaiTemperature);

    return config;
  }

  static writeToFile(config: Config): void {
    const configPath = ConfigService.getConfigPath();
    const content = JSON.stringify(config, null, 2);
    fs.writeFileSync(configPath, content);
  }
}
