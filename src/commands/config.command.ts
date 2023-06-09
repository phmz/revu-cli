import prompts from 'prompts';

import { CommandConfig } from '../interfaces';
import { ConfigService } from '../services/config.service';

import { BaseCommand } from './base.command';

class ConfigCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigCommandError';
  }
}

export class ConfigCommand extends BaseCommand<void> {
  constructor(config: CommandConfig) {
    super(config);
  }

  protected async _run(): Promise<void> {
    const response = await prompts(
      [
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
      ],
      {
        onCancel: () => {
          throw new ConfigCommandError('Setup was cancelled by the user');
        },
      },
    );

    await ConfigService.save({
      githubToken: response.githubToken,
      openaiApiKey: response.openApiKey,
    });
  }
}
