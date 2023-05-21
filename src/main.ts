import { Command } from 'commander';

const program = new Command();

program
  .version('0.0.1')
  .description('raven-cli - a CLI tool to automate code reviews with GPT-4');

program
  .command('config')
  .description('setup raven-cli')
  .action(() => {
    console.log('Setup config');
  });

program
  .command('pr <repository> <pull_request>')
  .description('review the specified pull request of the repository')
  .action((repository: string, pull_request: string) => {
    console.log(
      `Reviewing pull request ${pull_request} of repository ${repository}`,
    );
  });

program
  .command('local')
  .description('review the local changes')
  .action(() => {
    console.log('Reviewing local changes');
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
