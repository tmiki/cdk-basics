import { ProjectEnvironment } from './project-environment';
import { NamingUtil } from './naming-util';
import { LookupUtil } from './lookup-util';
import { DebugOutUtil } from './debug-out-util';
import { EnvConfig, EnvConfigKey } from '../envconfig/types';
import { EnvConfigDev1 } from '../envconfig/env-dev1';
import { EnvConfigPrd1 } from '../envconfig/env-prd1';
import { EnvConfigQas1 } from '../envconfig/env-qas1';
import { EnvConfigStg1 } from '../envconfig/env-stg1';

export type AllEnvConfigs = {
  [key: string]: EnvConfig;
};
const allEnvConfigs: AllEnvConfigs = {
  dev1: EnvConfigDev1,
  stg1: EnvConfigStg1,
  qas1: EnvConfigQas1,
  prd1: EnvConfigPrd1,
};

export class CdkUtil {
  // Composition objects.
  e: ProjectEnvironment;
  envConfig: EnvConfig;
  naming: NamingUtil;
  lookup: LookupUtil;
  debugOut: DebugOutUtil;

  // Make this class Singleton.
  private static instance: CdkUtil;
  public static getInstance(): CdkUtil {
    if (!CdkUtil.instance) {
      CdkUtil.instance = new CdkUtil();
    }
    return CdkUtil.instance;
  }

  // Initialize the object itself.
  constructor() {
    this.e = new ProjectEnvironment();
    this.envConfig = allEnvConfigs[this.e.envName];
    this.naming = new NamingUtil(this.e);
    this.lookup = new LookupUtil(this.e);
    this.debugOut = new DebugOutUtil(this.e);
  }

  // Retrieve a set of variables in the EnvConfig object.
  public getEnvConfig<K extends EnvConfigKey>(keyName: K): EnvConfig[K] {
    const value = this.envConfig[keyName];
    if (value === undefined) {
      throw new Error(`No configuration found for keyName: ${keyName} in environment: ${this.e.envName}`);
    }
    return value;
  }
}
