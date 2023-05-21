import { CommandConfig } from '../interfaces';

export abstract class BaseCommand<T> {
  protected config: CommandConfig;

  protected constructor(config: CommandConfig) {
    this.config = config;
  }

  public abstract run(args?: T): Promise<void>;
}
