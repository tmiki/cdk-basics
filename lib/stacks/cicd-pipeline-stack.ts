import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CdkUtil } from '../../utils/cdk-util';
import { CfnConnection } from 'aws-cdk-lib/aws-codestarconnections';
import { pascalCase } from 'change-case';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Artifact, Pipeline, PipelineType } from 'aws-cdk-lib/aws-codepipeline';
import { CodeStarConnectionsSourceAction, S3DeployAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { ArnPrincipal, CompositePrincipal, ManagedPolicy, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CaseStyle } from '../../utils/resource-name-string';

export class CicdPipelineStack extends Stack {
  private util = CdkUtil.getInstance();

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cicdPipelineConfig = this.util.getEnvConfig('cicdPipeline');

    // S3 Buckets
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html
    const artifactBucketName = this.util.getResourceNameString('cicd-artifact');
    const artifactBucket = new Bucket(this, artifactBucketName.pascalCase, {
      bucketName: artifactBucketName.kebabCase,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const deployDestBucketName = this.util.getResourceNameString('cicd-deploy-dest');
    const deployDestinationBucket = new Bucket(this, deployDestBucketName.pascalCase, {
      bucketName: deployDestBucketName.kebabCase,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // CodeStar connection with GitHub apps
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codestarconnections.CfnConnection.html
    const connectionName = this.util.getResourceNameString('examining-conn');
    if (connectionName.kebabCase.length > 32) {
      throw new Error(`The name lenght of a CodeStar connection cannot exceed 32 characters. connectionName: ${connectionName.kebabCase}`);
    }
    const connection = new CfnConnection(this, connectionName.pascalCase, {
      connectionName: connectionName.kebabCase,
      providerType: 'GitHub',
    });

    // CodePipeline
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline.Pipeline.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline.PipelineType.html
    const iamRoleForPipeline = this.createIAMRoleForPipeline('examining-cicd-pipeline', {
      connectionArn: connection.attrConnectionArn,
    });
    // const pipelineName = this.util.naming.generateResourceName('examining-cicd-with-github');
    const pipelineName = this.util.getResourceNameString('examining-cicd-with-github');
    const pipeline = new Pipeline(this, pipelineName.pascalCase, {
      pipelineName: pipelineName.kebabCase,
      pipelineType: PipelineType.V2,
      artifactBucket: artifactBucket,
      role: iamRoleForPipeline,
    });

    // Source stage
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline.Artifact.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline_actions.CodeStarConnectionsSourceAction.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline_actions.CodeStarConnectionsSourceActionProps.html
    const iamRoleForStages = this.createIAMRoleForStages('examining-cicd-stage', {
      connectionArn: connection.attrConnectionArn,
      iamRoleForPipelineArn: iamRoleForPipeline.roleArn,
      artifactBucketArn: artifactBucket.bucketArn,
      deployDestBucketArn: deployDestinationBucket.bucketArn,
    });

    const sourceOutput = new Artifact();
    const sourceAction = new CodeStarConnectionsSourceAction({
      actionName: 'GitHubSource',
      role: iamRoleForStages,
      owner: cicdPipelineConfig.apps.examining.gitRepository.owner,
      repo: cicdPipelineConfig.apps.examining.gitRepository.name,
      branch: cicdPipelineConfig.apps.examining.gitRepository.branch,
      connectionArn: connection.attrConnectionArn,
      output: sourceOutput,
    });
    pipeline.addStage({
      stageName: 'SourceStage',
      actions: [sourceAction],
    });

    // Deploy stage
    const deployAction = new S3DeployAction({
      actionName: 'S3Deploy',
      role: iamRoleForStages,
      bucket: deployDestinationBucket,
      input: sourceOutput,
      extract: true,
    });
    pipeline.addStage({
      stageName: 'DeployStage',
      actions: [deployAction],
    });
  }

  private createIAMRoleForPipeline(namePrefix: string, params: { connectionArn: string }): Role {
    // AWS CDK documents used within here.
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.Role.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.Policy.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.PolicyDocument.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.PolicyStatement.html

    // Create the IAM Policy for the Role of CodePipeline pipelines.
    const iamPolicyDocumentForPipeline = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ['iam:PassRole'],
          resources: ['*'],
          conditions: {
            StringEqualsIfExists: {
              'iam:PassedToService': ['cloudformation.amazonaws.com', 'elasticbeanstalk.amazonaws.com', 'ec2.amazonaws.com', 'ecs-tasks.amazonaws.com'],
            },
          },
        }),
        new PolicyStatement({
          actions: [
            'codedeploy:CreateDeployment',
            'codedeploy:GetApplication',
            'codedeploy:GetApplicationRevision',
            'codedeploy:GetDeployment',
            'codedeploy:GetDeploymentConfig',
            'codedeploy:RegisterApplicationRevision',
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          actions: ['codestar-connections:UseConnection'],
          resources: [params.connectionArn],
        }),
        new PolicyStatement({
          actions: ['lambda:InvokeFunction', 'lambda:ListFunctions'],
          resources: ['*'],
        }),
        new PolicyStatement({
          actions: [
            'cloudformation:CreateStack',
            'cloudformation:DeleteStack',
            'cloudformation:DescribeStacks',
            'cloudformation:UpdateStack',
            'cloudformation:CreateChangeSet',
            'cloudformation:DeleteChangeSet',
            'cloudformation:DescribeChangeSet',
            'cloudformation:ExecuteChangeSet',
            'cloudformation:SetStackPolicy',
            'cloudformation:ValidateTemplate',
          ],
          resources: [`arn:aws:cloudformation:${this.util.e.regionName}:${this.util.e.accountId}:stack/${this.util.e.pjCodeName}-${this.util.e.envName}-*`],
        }),
        new PolicyStatement({
          actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild', 'codebuild:BatchGetBuildBatches', 'codebuild:StartBuildBatch'],
          resources: ['*'],
        }),
        new PolicyStatement({
          actions: ['cloudformation:ValidateTemplate'],
          resources: ['*'],
        }),
        new PolicyStatement({
          actions: ['ecr:DescribeImages'],
          resources: ['*'],
        }),
      ],
    });

    // Convert the policy document to JSON
    const iamPolicyJson = JSON.stringify(iamPolicyDocumentForPipeline.toJSON(), null, 2);

    // Specify the output filename
    const outFileName = `${__dirname}/../../debug_out/${namePrefix}-policy.json`;

    // Write the JSON to the specified file
    this.util.debugOut.writeJsonFile(outFileName, iamPolicyJson);

    // Create the IAM Role for CodePipeline pipelines.
    const iamRoleForPipelineName = this.util.getResourceNameString(`${namePrefix}-role`);
    const iamRoleForPipeline = new Role(this, iamRoleForPipelineName.pascalCase, {
      roleName: iamRoleForPipelineName.kebabCase,
      path: '/',
      assumedBy: new CompositePrincipal(new ServicePrincipal('codepipeline.amazonaws.com')),
      inlinePolicies: { [`${namePrefix}-policy`]: iamPolicyDocumentForPipeline },
    });

    return iamRoleForPipeline;
  }

  private createIAMRoleForStages(
    namePrefix: string,
    params: {
      connectionArn: string;
      iamRoleForPipelineArn: string;
      artifactBucketArn: string;
      deployDestBucketArn: string;
    }
  ): Role {
    // AWS CDK documents used within here.
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.Role.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.ManagedPolicy.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.Policy.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.PolicyDocument.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.PolicyStatement.html

    // Create the IAM Custom Managed Policy for the Role of CodePipeline stages.
    // - Source stage
    const iamPolicyForSourceStageName = this.util.getResourceNameString(`${namePrefix}-source-policy`);
    const iamPolicyForSourceStage = new ManagedPolicy(this, iamPolicyForSourceStageName.pascalCase, {
      managedPolicyName: iamPolicyForSourceStageName.kebabCase,
      document: new PolicyDocument({
        statements: [
          new PolicyStatement({
            actions: ['codestar-connections:UseConnection'],
            resources: [params.connectionArn],
          }),
          new PolicyStatement({
            actions: [
              's3:Abort*',
              's3:DeleteObject*',
              's3:GetBucket*',
              's3:GetObject*',
              's3:List*',
              's3:PutObject',
              's3:PutObjectLegalHold',
              's3:PutObjectRetention',
              's3:PutObjectTagging',
              's3:PutObjectVersionTagging',
            ],
            resources: [params.artifactBucketArn, `${params.artifactBucketArn}/*`],
          }),
          new PolicyStatement({
            actions: ['s3:PutObjectAcl', 's3:PutObjectVersionAcl'],
            resources: [params.artifactBucketArn],
          }),
        ],
      }),
    });

    // - Deploy stage
    const iamPolicyForDeployStageName = this.util.getResourceNameString(`${namePrefix}-deploy-policy`);
    const iamPolicyForDeployStage = new ManagedPolicy(this, iamPolicyForDeployStageName.pascalCase, {
      managedPolicyName: iamPolicyForDeployStageName.kebabCase,
      document: new PolicyDocument({
        statements: [
          new PolicyStatement({
            actions: [
              's3:Abort*',
              's3:DeleteObject*',
              's3:PutObject',
              's3:PutObjectLegalHold',
              's3:PutObjectRetention',
              's3:PutObjectTagging',
              's3:PutObjectVersionTagging',
            ],
            resources: [params.deployDestBucketArn, `${params.deployDestBucketArn}/*`],
          }),
          new PolicyStatement({
            actions: ['s3:GetBucket*', 's3:GetObject*', 's3:List*'],
            resources: [params.deployDestBucketArn],
          }),
        ],
      }),
    });

    // Create the IAM Role for CodeBuild/CodeDeploy tasks.
    const iamRoleForStagesName = this.util.getResourceNameString(`${namePrefix}-role`);
    const iamRoleForStages = new Role(this, iamRoleForStagesName.pascalCase, {
      roleName: iamRoleForStagesName.kebabCase,
      path: '/',
      assumedBy: new CompositePrincipal(new ArnPrincipal(params.iamRoleForPipelineArn), new ServicePrincipal('codebuild.amazonaws.com')),
      managedPolicies: [iamPolicyForSourceStage, iamPolicyForDeployStage],
    });

    return iamRoleForStages;
  }
}
