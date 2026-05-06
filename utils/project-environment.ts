import { Environment } from 'aws-cdk-lib';

const ENV_NAMES = ['dev1', 'stg1', 'qas1', 'prd1', 'test'];
type EnvName = (typeof ENV_NAMES)[number];

export class ProjectEnvironment {
  static readonly GLOBAL_REGION = 'us-east-1';
  /** プロジェクトコード名 */
  static PJ_CODE_NAME: string;
  /** 環境名 */
  static ENV_NAME: string;
  /** AWSアカウントID */
  public static ACCOUNT_ID: string;
  /** AWSリージョン名 */
  public static REGION_NAME: string;
  /** AWSグローバルリージョン名 */
  public static GLOBAL_REGION_NAME = 'us-east-1';
  /** デバッグモードフラグ */
  public static DEBUG_ENABLED: boolean;

  static {
    const { ENV_NAME, PJ_CODE_NAME, CDK_DEFAULT_ACCOUNT, CDK_DEFAULT_REGION, DEBUG_ENABLED } = process.env;
    if (!ENV_NAME || !PJ_CODE_NAME || !CDK_DEFAULT_ACCOUNT || !CDK_DEFAULT_REGION) {
      throw new Error('Necessary environment variables are not set sufficiently.');
    }
    if (!ENV_NAMES.includes(ENV_NAME)) {
      throw new Error(`Invalid ENV_NAME: '${ENV_NAME}'. Must be one of: ${ENV_NAMES.join(', ')}.`);
    }
    this.ENV_NAME = ENV_NAME;
    this.PJ_CODE_NAME = PJ_CODE_NAME;
    this.ACCOUNT_ID = CDK_DEFAULT_ACCOUNT;
    this.REGION_NAME = CDK_DEFAULT_REGION;
    this.DEBUG_ENABLED = DEBUG_ENABLED === 'true';
  }

  /**
   * スタック引数用envオブジェクト取得（現在のリージョン）
   */
  static get stackEnvForLocal(): Environment {
    return {
      account: ProjectEnvironment.ACCOUNT_ID,
      region: ProjectEnvironment.REGION_NAME,
    };
  }

  /**
   *  スタック引数用envオブジェクト取得（グローバルリージョン）
   */
  static get stackEnvForGlobal(): Environment {
    return {
      account: ProjectEnvironment.ACCOUNT_ID,
      region: ProjectEnvironment.GLOBAL_REGION_NAME,
    };
  }
}
