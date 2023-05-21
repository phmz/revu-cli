import prompts from 'prompts';

import { CommandConfig } from '../interfaces';
import ConfigService from '../services/config.service';

import { BaseCommand } from './base.command';

export class ConfigCommand extends BaseCommand<void> {
  constructor(config: CommandConfig) {
    super(config);
  }

  public async run(): Promise<void> {
    const response = await prompts([
      {
        type: 'password',
        name: 'githubToken',
        message: 'Please enter your GitHub token:',
        validate: (input: string) => {
          if (input.length === 0) {
            return 'GitHub token cannot be empty!';
          }
          return true;
        },
      },
      {
        type: 'password',
        name: 'openApiKey',
        message: 'Please enter your OpenAI API key:',
        validate: (input: string) => {
          if (input.length === 0) {
            return 'OpenAI API key cannot be empty!';
          }
          return true;
        },
      },
    ]);

    const config = ConfigService.newConfig({
      githubToken: response.githubToken,
      openaiApiKey: response.openApiKey,
    });
    await ConfigService.writeToFile(config);
  }
}
