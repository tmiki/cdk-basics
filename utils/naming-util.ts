import { paramCase, pascalCase, snakeCase } from 'change-case';
import { ProjectEnvironment } from './project-environment';

export class NamingUtil {
  e: ProjectEnvironment;

  constructor(e: ProjectEnvironment) {
    this.e = e;
  }

  public generateResourceName(name: string) {
    return paramCase(`${this.e.pjCodeName}-${this.e.envName}-${name}`);
  }

  public generateResourceNameWithRegion(name: string) {
    return paramCase(`${this.e.pjCodeName}-${this.e.envName}-${name}-${this.e.regionName}`);
  }

  public generateResourceNameWithAccountIdCurrentRegion(name: string) {
    return paramCase(`${this.e.pjCodeName}-${this.e.envName}-${name}-${this.e.accountId}-${this.e.regionName}`);
  }

  public generateResourceNameWithAccountIdSpecificRegion(name: string, region: string) {
    return paramCase(`${this.e.pjCodeName}-${this.e.envName}-${name}-${this.e.accountId}-${region}`);
  }

  public generateParameterStoreName(name: string) {
    return `/${this.e.pjCodeName}/${this.e.envName}/${name}`;
  }
}
