import * as fs from 'fs';
import { ProjectEnvironment } from './project-environment';

export class DebugOutUtil {
  public writeJsonFile(outFileName: string, contentJson: string) {
    if (!ProjectEnvironment.DEBUG_ENABLED) return;

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
