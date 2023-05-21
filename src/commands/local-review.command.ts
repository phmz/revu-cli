import { CommandConfig } from '../interfaces';
import { ConfigService } from '../services/config.service';
import { OpenAiService } from '../services/openai.service';
import { GitLocalService } from '../services/git/git-local.service';

import { BaseCommand } from './base.command';

export class LocalReviewCommand extends BaseCommand<void> {
  constructor(config: CommandConfig) {
    super(config);
  }

  public async run(): Promise<void> {
    const config = ConfigService.fromFile();
    const openAIConfig = config.llm.openai;

    const localDiff = await GitLocalService.getLocalDiff();

    const review = await OpenAiService.reviewCode(openAIConfig, localDiff);

    process.stdout.write(review + '\n');
  }
}
