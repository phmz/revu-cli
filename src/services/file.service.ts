import fs from 'fs';

import fg from 'fast-glob';
import prompts from 'prompts';
import escapeStringRegexp from 'escape-string-regexp';

class FileServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileServiceError';
  }
}

export class FileService {
  public static async getFileContent(
    directory: string,
    filename: string,
  ): Promise<string> {
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
        message: 'Multiple files match. Please select a file:',
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

    return fs.readFileSync(file, 'utf8');
  }
}
