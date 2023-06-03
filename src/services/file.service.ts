import fs from 'fs';

import fg from 'fast-glob';
import prompts from 'prompts';
import escapeStringRegexp from 'escape-string-regexp';
import chalk from 'chalk';

import { GetFileResponse, GitFileChange } from '../interfaces';

class FileServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileServiceError';
  }
}

export class FileService {
  public static async getFileContentAndName(
    directory: string,
    filename: string,
  ): Promise<GetFileResponse> {
    const escapedFilename = escapeStringRegexp(filename);
    const pattern = `${directory}/**/*${escapedFilename}*`;
    const matches = await fg(pattern, { onlyFiles: true });

    if (matches.length === 0) {
      throw new FileServiceError(
        `File ${filename} not found in directory ${directory}`,
      );
    }

    let file: string;

    if (matches.length === 1) {
      file = matches[0];
    } else {
      const response = await prompts({
        type: 'autocomplete',
        name: 'file',
        message: 'Multiple files match. Please select a file to review:',
        choices: matches
          .sort()
          .map((match) => ({ title: match, value: match })),
        initial: 0,
        suggest: (input, choices) => {
          const inputValue = input.toLowerCase();
          const filteredChoices = choices.filter((choice) =>
            choice.title.toLowerCase().includes(inputValue),
          );
          return Promise.resolve(filteredChoices);
        },
      });

      if (!response.file) {
        throw new FileServiceError('No file was selected from the prompt');
      }

      file = response.file;
    }

    const content = fs.readFileSync(file, 'utf8');

    return { filename: file, content };
  }

  public static async selectFiles(
    fileChanges: GitFileChange[],
  ): Promise<GitFileChange[]> {
    const response = await prompts({
      type: 'multiselect',
      name: 'files',
      message: 'Select files to commit:',
      choices: fileChanges
        .sort((a, b) => a.filename.localeCompare(b.filename))
        .map((fileChange) => ({
          title: this.colorize(fileChange),
          value: fileChange,
        })),
      initial: 0,
      min: 1,
      max: fileChanges.length,
    });

    if (!response.files) {
      throw new FileServiceError('No files were selected from the prompt');
    }

    return response.files;
  }

  public static addLineNumbers(content: string): string {
    return content
      .split('\n')
      .map((line, index) => `${index + 1} | ${line}`)
      .join('\n');
  }

  private static colorize(fileChange: GitFileChange): string {
    switch (fileChange.status) {
      case 'added':
        return chalk.green(fileChange.filename);
      case 'deleted':
        return chalk.red(fileChange.filename);
      case 'changed':
        return chalk.cyan(fileChange.filename);
    }
  }
}
