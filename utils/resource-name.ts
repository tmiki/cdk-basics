import { paramCase, pascalCase, snakeCase } from 'change-case';
import { ProjectEnvironment } from './project-environment';
import { ParameterStorePartialKey, RegionNameType, RegionShortNames } from './resource-name-types';

export enum CaseStyle {
  PASCAL = 'pascal',
  SNAKE = 'snake',
  KEBAB = 'kebab',
}

export class ResourceName {
  private readonly nameKeyword: string;

  constructor(nameKeyword: string) {
    this.nameKeyword = nameKeyword;
  }

  /** コンストラクトIDに指定する文字列。nameKeyword のPascalCase表現。 */
  constructId(): string {
    return pascalCase(this.nameKeyword);
  }

  /** AWSリソース名として指定する文字列。`{pj}-{env}-{keyword}` 形式の文字列。 */
  resourceName(): string {
    return this.kebabCase();
  }

  /** `{pj}-{env}-{keyword}` 形式のリソース名（kebab-case） */
  kebabCase(): string {
    return paramCase(`${ProjectEnvironment.PJ_CODE_NAME}-${ProjectEnvironment.ENV_NAME}-${this.nameKeyword}`);
  }

  /** `{Pj}{Env}{Keyword}` 形式のリソース名（PascalCase） */
  pascalCase(): string {
    return pascalCase(this.kebabCase());
  }

  /** `{pj}_{env}_{keyword}` 形式のリソース名（snake_case） */
  snakeCase(): string {
    return snakeCase(this.kebabCase());
  }

  /** `{pj}-{env}-{keyword}-{region}` 形式のリソース名（kebab-case） */
  kebabCaseWithRegion(regionNameType = RegionNameType.SHORTENED): string {
    const region = this.resolveRegion(ProjectEnvironment.REGION_NAME, regionNameType);
    return paramCase(`${ProjectEnvironment.PJ_CODE_NAME}-${ProjectEnvironment.ENV_NAME}-${this.nameKeyword}-${region}`);
  }

  /** `{Pj}{Env}{Keyword}{Region}` 形式のリソース名（PascalCase） */
  pascalCaseWithRegion(regionNameType = RegionNameType.SHORTENED): string {
    return pascalCase(this.kebabCaseWithRegion(regionNameType));
  }

  /** `{pj}_{env}_{keyword}_{region}` 形式のリソース名（snake_case） */
  snakeCaseWithRegion(regionNameType = RegionNameType.SHORTENED): string {
    return snakeCase(this.kebabCaseWithRegion(regionNameType));
  }

  /** `{pj}-{env}-{keyword}-{accountId}-{region}` 形式のリソース名（kebab-case） */
  kebabCaseWithAccountIdAndRegion(regionNameType = RegionNameType.SHORTENED): string {
    const region = this.resolveRegion(ProjectEnvironment.REGION_NAME, regionNameType);
    return paramCase(`${ProjectEnvironment.PJ_CODE_NAME}-${ProjectEnvironment.ENV_NAME}-${this.nameKeyword}-${ProjectEnvironment.ACCOUNT_ID}-${region}`);
  }

  /** `{Pj}{Env}{Keyword}{AccountId}{Region}` 形式のリソース名（PascalCase） */
  pascalCaseWithAccountId(regionNameType = RegionNameType.SHORTENED): string {
    return pascalCase(this.kebabCaseWithAccountIdAndRegion(regionNameType));
  }

  // ------------------------------ static メソッド ------------------------------
  /** SSM パラメータストア用のパス `/{pj}/{env}/{name}` を返す */
  static parameterStoreName(name: ParameterStorePartialKey): string {
    return `/${ProjectEnvironment.PJ_CODE_NAME}/${ProjectEnvironment.ENV_NAME}/${name}`;
  }

  // ------------------------------ プライベートメソッド ------------------------------
  /** リージョン名を解決する。SHORTENED 指定時は RegionShortNames から短縮形を返す */
  private resolveRegion(regionName: string, regionNameType: RegionNameType): string {
    if (regionNameType === RegionNameType.SHORTENED) {
      const regionShortName = RegionShortNames[regionName as keyof typeof RegionShortNames];
      if (!regionShortName) {
        throw new Error(`No short name defined for region: ${regionName}`);
      }
      return regionShortName;
    }
    return regionName;
  }
}
