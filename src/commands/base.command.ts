import { CommandConfig, RunArgs } from '../interfaces';

export abstract class BaseCommand<T> {
  protected config: CommandConfig;

  protected constructor(config: CommandConfig) {
    this.config = config;
  }

  public abstract run(args: RunArgs<T>): Promise<void>;
  public abstract run(): Promise<void>;
}
