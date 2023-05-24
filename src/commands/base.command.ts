import ora from 'ora';

import { CommandConfig } from '../interfaces';
import { logger } from '../logger';

export abstract class BaseCommand<T> {
  protected config: CommandConfig;
  protected spinner: ora.Ora;

  protected constructor(config: CommandConfig) {
    this.config = config;
    this.spinner = ora();
  }

  protected abstract _run(args?: T): Promise<void>;

  public async run(args?: T): Promise<void> {
    try {
      await this._run(args);
    } catch (error: any) {
      this.spinner.stop();
      logger.error(error.message);
      process.exit(1);
    }
  }
}
