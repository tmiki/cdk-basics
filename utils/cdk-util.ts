import { EnvConfigDev1 } from '../envconfig/env-dev1';
import { EnvConfigPrd1 } from '../envconfig/env-prd1';
import { EnvConfigQas1 } from '../envconfig/env-qas1';
import { EnvConfigStg1 } from '../envconfig/env-stg1';
import { EnvConfig, EnvConfigKey } from '../envconfig/types';
import { DebugOutUtil } from './debug-out-util';
import { LookupUtil } from './lookup-util';
import { ProjectEnvironment } from './project-environment';
import { ResourceName } from './resource-name';

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
  static readonly E = ProjectEnvironment;

  private static _envConfig: EnvConfig | undefined;
  private static _lookup: LookupUtil | undefined;
  private static _debugOut: DebugOutUtil | undefined;

  static get envConfig(): EnvConfig {
    if (!this._envConfig) {
      this._envConfig = allEnvConfigs[ProjectEnvironment.ENV_NAME];
      if (!this._envConfig) {
        throw new Error(`No configuration found for environment: ${ProjectEnvironment.ENV_NAME}`);
      }
    }
    return this._envConfig;
  }

  static get lookup(): LookupUtil {
    if (!this._lookup) {
      this._lookup = new LookupUtil();
    }
    return this._lookup;
  }

  static get debugOut(): DebugOutUtil {
    if (!this._debugOut) {
      this._debugOut = new DebugOutUtil();
    }
    return this._debugOut;
  }

  static getEnvConfig<K extends EnvConfigKey>(keyName: K): EnvConfig[K] {
    const value = this.envConfig[keyName];
    if (value === undefined) {
      throw new Error(`No configuration found for keyName: ${keyName} in environment: ${ProjectEnvironment.ENV_NAME}`);
    }
    return value;
  }

  static getResourceName(name: string): ResourceName {
    return new ResourceName(name);
  }
}
