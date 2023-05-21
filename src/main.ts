import { Command } from 'commander';

import { ConfigCommand } from './commands/config.command';
import { LocalReviewCommand } from './commands/local-review.command';
import { PullRequestReviewCommand } from './commands/pull-request-review.command';
import { LocalReviewArgs } from './interfaces';

const program = new Command();

program
  .version('0.0.1')
  .description('raven-cli - a CLI tool to automate code reviews with GPT-4');

program
  .command('config')
  .description('setup raven-cli')
  .action(async () => {
    const configCommand = new ConfigCommand({ commandName: 'config' });
    await configCommand.run();
  });

program
  .command('pr <repository> <pull_request>')
  .description('review the specified pull request of the repository')
  .action(async (repository: string, pullRequest: string) => {
    const pullRequestReviewCommand = new PullRequestReviewCommand({
      commandName: 'pr-review',
    });
    await pullRequestReviewCommand.run({
      fullRepository: repository,
      pullRequest,
    });
  });

program
  .command('local')
  .description('review the local changes and file')
  .option('-f, --filename <filename>', 'filename to search and review', '')
  .option(
    '-d, --directory <directory>',
    'directory of the file to search and review',
    '.',
  )
  .action(async (localReviewArgs: LocalReviewArgs) => {
    const localReviewCommand = new LocalReviewCommand({
      commandName: 'local-review',
    });
    await localReviewCommand.run(localReviewArgs);
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
