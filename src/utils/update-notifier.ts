import { execSync } from 'child_process';

import chalk from 'chalk';

import { logger } from '../logger';

export const checkForUpdate = (version: string) => {
  try {
    const latestVersion = execSync('npm show revu-cli version')
      .toString()
      .trim();
    if (latestVersion !== version) {
      logger.info(
        chalk.yellow(
          `\nNew version (${latestVersion}) of revu-cli is available. Consider updating.`,
        ),
      );
    }
  } catch (error) {
    logger.error(chalk.red(`\nFailed to check for updates.`));
  }
};
