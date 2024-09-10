import { paramCase, pascalCase, snakeCase } from 'change-case';
import { ProjectEnvironment } from './project-environment';

export enum CaseStyle {
  PASCAL = 'pascal',
  SNAKE = 'snake',
  KEBAB = 'kebab',
}

export class ResourceNameString {
  private nameKeyword: string;
  private e: ProjectEnvironment;

  constructor(nameKeyword: string, pe: ProjectEnvironment) {
    this.nameKeyword = nameKeyword;
    this.e = pe;
  }

  get pascalCase(): string {
    return this.getName(CaseStyle.PASCAL);
  }

  get snakeCase(): string {
    return this.getName(CaseStyle.SNAKE);
  }

  get kebabCase(): string {
    return this.getName(CaseStyle.KEBAB);
  }

  private getName(caseStyle: CaseStyle): string {
    const resourceName = paramCase(`${this.e.pjCodeName}-${this.e.envName}-${this.nameKeyword}`);
    switch (caseStyle) {
      case CaseStyle.PASCAL:
        return pascalCase(resourceName);
      case CaseStyle.SNAKE:
        return snakeCase(resourceName);
      case CaseStyle.KEBAB:
        return paramCase(resourceName);
      default:
        return pascalCase(resourceName);
    }
  }

  get pascalCaseWithRegion(): string {
    return this.getNameWithRegion(CaseStyle.PASCAL);
  }

  get snakeCaseWithRegion(): string {
    return this.getNameWithRegion(CaseStyle.SNAKE);
  }

  get kebabCaseWithRegion(): string {
    return this.getNameWithRegion(CaseStyle.KEBAB);
  }

  private getNameWithRegion(caseStyle: CaseStyle): string {
    const resourceName = `${this.e.pjCodeName}-${this.e.envName}-${this.nameKeyword}-${this.e.regionName}`;
    switch (caseStyle) {
      case CaseStyle.PASCAL:
        return pascalCase(resourceName);
      case CaseStyle.SNAKE:
        return snakeCase(resourceName);
      case CaseStyle.KEBAB:
        return paramCase(resourceName);
      default:
        return pascalCase(resourceName);
    }
  }

  get pascalCaseWithAccountIdCurrentRegion(): string {
    return this.getNameWithAccountIdCurrentRegion(CaseStyle.PASCAL);
  }

  get snakeCaseWithAccountIdCurrentRegion(): string {
    return this.getNameWithAccountIdCurrentRegion(CaseStyle.SNAKE);
  }

  get kebabCaseWithAccountIdCurrentRegion(): string {
    return this.getNameWithAccountIdCurrentRegion(CaseStyle.KEBAB);
  }

  private getNameWithAccountIdCurrentRegion(caseStyle: CaseStyle): string {
    const resourceName = `${this.e.pjCodeName}-${this.e.envName}-${this.nameKeyword}-${this.e.accountId}-${this.e.regionName}`;
    switch (caseStyle) {
      case CaseStyle.PASCAL:
        return pascalCase(resourceName);
      case CaseStyle.SNAKE:
        return snakeCase(resourceName);
      case CaseStyle.KEBAB:
        return paramCase(resourceName);
      default:
        return pascalCase(resourceName);
    }
  }

  public getNameWithAccountIdSpecificRegion(region: string, caseStyle: CaseStyle = CaseStyle.KEBAB): string {
    const resourceName = `${this.e.pjCodeName}-${this.e.envName}-${this.nameKeyword}-${this.e.accountId}-${region}`;
    switch (caseStyle) {
      case CaseStyle.PASCAL:
        return pascalCase(resourceName);
      case CaseStyle.SNAKE:
        return snakeCase(resourceName);
      case CaseStyle.KEBAB:
        return paramCase(resourceName);
      default:
        return pascalCase(resourceName);
    }
  }
}
