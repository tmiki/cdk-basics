import { Environment } from 'aws-cdk-lib';
import { pascalCase } from 'change-case';

export class ProjectEnvironment {
  envName: string;
  pjCodeName: string;
  accountId: string;
  regionName: string;
  globalRegionName = 'us-east-1';

  constructor() {
    // Retrieve environemt variables and put them into this object.
    const pe = process.env;
    if (pe.ENV_NAME === undefined || pe.PJ_CODE_NAME === undefined || pe.CDK_DEFAULT_ACCOUNT === undefined || pe.CDK_DEFAULT_REGION === undefined) {
      throw new Error('Necessary environemnt variables are not set sufficiently.');
    }
    this.envName = pe.ENV_NAME;
    this.pjCodeName = pe.PJ_CODE_NAME;
    this.accountId = pe.CDK_DEFAULT_ACCOUNT;
    this.regionName = pe.CDK_DEFAULT_REGION;
  }

  get envNamInPascalCase(): string {
    return pascalCase(this.envName);
  }

  get pjCodeInPascalCase(): string {
    return pascalCase(this.pjCodeName);
  }

  get environmentPassingInStack(): Environment {
    return {
      account: this.accountId,
      region: this.regionName,
    };
  }
}
