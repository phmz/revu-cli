import fs from 'fs';

import fg from 'fast-glob';
import prompts from 'prompts';
import escapeStringRegexp from 'escape-string-regexp';

interface GetFileResponse {
  content: string;
  filename: string;
}
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

  static async selectFiles(filenames: string[]): Promise<string[]> {
    const response = await prompts({
      type: 'multiselect',
      name: 'files',
      message: 'Select files to commit:',
      choices: filenames
        .sort()
        .map((filename) => ({ title: filename, value: filename })),
      initial: 0,
      min: 1,
      max: filenames.length,
    });

    if (!response.files) {
      throw new FileServiceError('No files were selected from the prompt');
    }

    return response.files;
  }
}
