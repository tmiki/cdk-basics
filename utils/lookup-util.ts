import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { pascalCase } from 'pascal-case';
import { ParameterStorePartialKey } from '../utils/resource-name-types';
import { ProjectEnvironment } from './project-environment';
import { ResourceName } from './resource-name';

/** CDK bootstrap Qualifier デフォルト値 */
const CDK_QUALIFIER_DEFAULT: string = 'hnb659fds';

/**
 * リソース参照
 *
 * @remarks
 * 既存のリソースを参照するための機能群を提供する。
 * スタティッククラス相当の用い方をする。
 */
export class ResourceLookup {
  /** SSM Parameter Store格納値取得 */
  // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ssm.StringParameter.html
  static getSsmParameterValue(scope: Construct, partialKey: ParameterStorePartialKey) {
    const ssmParameterKeyName = ResourceName.parameterStoreName(partialKey);
    const value = StringParameter.fromStringParameterAttributes(scope, pascalCase(`${ssmParameterKeyName}-ssm-parameter-value`), {
      parameterName: ssmParameterKeyName,
    }).stringValue;
    return value;
  }

  /** CDK関連リソース プレフィクス取得 */
  static getCdkResourcePrefix(scope: Construct): string {
    const bootstrapQualifier = scope.node.tryGetContext('@aws-cdk/core:bootstrapQualifier') ?? CDK_QUALIFIER_DEFAULT;
    return `cdk-${bootstrapQualifier}`;
  }

  /** CDK Asset ECRリポジトリ名取得 */
  static getCdkAssetEcrName(scope: Construct): string {
    const bootstrapQualifier = scope.node.tryGetContext('@aws-cdk/core:bootstrapQualifier') ?? CDK_QUALIFIER_DEFAULT;
    return `cdk-${bootstrapQualifier}-container-assets-${ProjectEnvironment.ACCOUNT_ID}-${ProjectEnvironment.REGION_NAME}`;
  }
}
