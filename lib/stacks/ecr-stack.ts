import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Repository, RepositoryEncryption, TagMutability } from 'aws-cdk-lib/aws-ecr';
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { CdkUtil } from '../../utils/cdk-util';
import { ResourceName } from '../../utils/resource-name';
import { ParameterStorePartialKey } from '../../utils/resource-name-types';

// 定数・コード値定義
export const EcrNameKeywords = ['ecr-webapi'];

/**
 * アプリコンテナイメージ格納先
 *
 */
export class EcrStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Retrieve the Configuration variables.
    const ecrRepositoryEnvConfig = CdkUtil.getEnvConfig('ecrRepository');

    // ECRリポジトリの作成
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.PolicyStatement.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.ServicePrincipal.html
    // https://docs.aws.amazon.com/lambda/latest/dg/images-create.html#configuration-images-permissions

    EcrNameKeywords.forEach((ecrNameKeyword) => {
      // リソースの作成
      // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecr.Repository.html
      const repoName = CdkUtil.getResourceName(ecrNameKeyword);
      const appRepo = new Repository(this, repoName.constructId(), {
        repositoryName: repoName.kebabCase(),
        encryption: RepositoryEncryption.AES_256,
        emptyOnDelete: true,
        removalPolicy: RemovalPolicy.DESTROY,
        imageTagMutability: TagMutability.IMMUTABLE,
        imageScanOnPush: false,
        lifecycleRules: [{ maxImageCount: ecrRepositoryEnvConfig.lifecycleRules.maxImageCount }],
      });

      // Lambdaデプロイ用のResourceBased Policy追加
      const policyStatement = new PolicyStatement(
        new PolicyStatement({
          principals: [new ServicePrincipal('lambda.amazonaws.com')],
          actions: ['ecr:BatchGetImage', 'ecr:GetDownloadUrlForLayer'],
        }),
      );
    });

    // WebAPI ECRイメージ最新URI格納用 Secret の作成
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_secretsmanager.Secret.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_secretsmanager.SecretStringGenerator.html
    const webapiLatestImageUriSecretName = CdkUtil.getResourceName('ecr-webapi-latest-image-uri-secret');
    const webapiLatestImageUriSecret = new Secret(this, webapiLatestImageUriSecretName.constructId(), {
      secretName: webapiLatestImageUriSecretName.kebabCase(),
    });

    // 「WebAPI ECRイメージ最新URI格納用」SSM Parameter Storeの作成
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ssm.StringParameter.html
    const paramKeyName = CdkUtil.getResourceName('ecr-webapi-latest-image-uri-secret-arn-store');
    new StringParameter(this, paramKeyName.constructId(), {
      parameterName: ResourceName.parameterStoreName(ParameterStorePartialKey.ECR_WEBAPI_LATEST_IMAGE_URI_SECRET_ARN),
      stringValue: webapiLatestImageUriSecret.secretArn,
      description: 'ARN of the Secrets Manager Secret retains the ecr-webapi latest image URI.',
    });
  }
}
