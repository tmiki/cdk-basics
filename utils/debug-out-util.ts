import { paramCase } from 'change-case';
import { ProjectEnvironment } from './project-environment';
import * as fs from 'fs';

export class DebugOutUtil {
  e: ProjectEnvironment;

  constructor(e: ProjectEnvironment) {
    this.e = e;
  }

  public writeJsonFile(outFileName: string, contentJson: string) {
    // Write the JSON to the specified file
    fs.writeFile(outFileName, contentJson, (err) => {
      if (err) {
        console.error('Error writing file:', err);
        throw new Error(`Error writing file. message: ${err.message}`);
      } else {
        console.log(`IAM policy written to ${outFileName}`);
      }
    });
  }
}
