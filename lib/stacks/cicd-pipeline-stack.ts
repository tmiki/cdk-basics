import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { CdkUtil } from "../../utils/cdk-util";
import { CfnConnection } from "aws-cdk-lib/aws-codestarconnections";
import { pascalCase } from "change-case";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Artifact, Pipeline, PipelineType } from "aws-cdk-lib/aws-codepipeline";
import { CodeStarConnectionsSourceAction, S3DeployAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { CompositePrincipal, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

export class CicdPipelineStack extends Stack {
  private cdkUtil = CdkUtil.getInstance();
  
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    // S3 Buckets
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html
    const artifactBucketName = this.cdkUtil.naming.generateResourceNameWithAccountIdCurrentRegion("cicd-artifact-2");
    const artifactBucket = new Bucket(this, pascalCase(artifactBucketName), {
      bucketName: artifactBucketName,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const deployDestBucketName = this.cdkUtil.naming.generateResourceNameWithAccountIdCurrentRegion("cicd-deploy-dest-2");
    const deployDestinationBucket = new Bucket(this, pascalCase(deployDestBucketName), {
      bucketName: deployDestBucketName,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // CodeStar connection with GitHub apps
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codestarconnections.CfnConnection.html
    const connectionName = this.cdkUtil.naming.generateResourceName("examining-conn");
    console.log(connectionName)
    if (connectionName.length > 32 ){
      throw new Error(
        'The name lenght of a CodeStar connection cannot exceed 32 characters.'
      );
    }
    const connection = new CfnConnection(this, pascalCase(connectionName), {
      connectionName: connectionName,
      providerType: 'GitHub',
    });

    // CodePipeline
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline.Pipeline.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline.PipelineType.html
    const pipelineName = this.cdkUtil.naming.generateResourceName("examining-cicd-with-github");
    const pipeline = new Pipeline(this, pascalCase(pipelineName), {
      pipelineName: pipelineName,
      pipelineType: PipelineType.V2,
      artifactBucket: artifactBucket,
      role: this.createIAMRoleForPipeline('examining-cicd', {connectionArn: connection.attrConnectionArn}),
    });

    // Source stage
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline.Artifact.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline_actions.CodeStarConnectionsSourceAction.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline_actions.CodeStarConnectionsSourceActionProps.html
    const sourceOutput = new Artifact();
    const sourceAction = new CodeStarConnectionsSourceAction({
      actionName: 'GitHub_Source',
      owner: 'tmiki',
      repo: 'examining-cicd-with-github',
      branch: 'main',
      connectionArn: connection.attrConnectionArn,
      output: sourceOutput,
    });
    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Deploy stage
    const deployAction = new S3DeployAction({
      actionName: 'S3_Deploy',
      bucket: deployDestinationBucket,
      input: sourceOutput,
      extract: true,
    });
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction],
    });
  }


  private createIAMRoleForPipeline(namePrefix: string, params: {connectionArn: string}): Role {
    // AWS CDK documents used within here.
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.Role.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.Policy.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.PolicyDocument.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.PolicyStatement.html

    // Create the IAM Policy for the Role of CodePipeline pipelines.
    const iamPolicyDocumentForPipeline = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ["iam:PassRole"],
          resources: ["*"],
          conditions: {
            StringEqualsIfExists: {
              "iam:PassedToService": [
                "cloudformation.amazonaws.com",
                "elasticbeanstalk.amazonaws.com",
                "ec2.amazonaws.com",
                "ecs-tasks.amazonaws.com",
              ],
            },
          },
        }),
        new PolicyStatement({
          actions: [
            "codedeploy:CreateDeployment",
            "codedeploy:GetApplication",
            "codedeploy:GetApplicationRevision",
            "codedeploy:GetDeployment",
            "codedeploy:GetDeploymentConfig",
            "codedeploy:RegisterApplicationRevision",
          ],
          resources: ["*"],
        }),
        new PolicyStatement({
          actions: ["codestar-connections:UseConnection"],
          resources: [params.connectionArn],
        }),
        new PolicyStatement({
          actions: ["lambda:InvokeFunction", "lambda:ListFunctions"],
          resources: ["*"],
        }),
        new PolicyStatement({
          actions: [
            "cloudformation:CreateStack",
            "cloudformation:DeleteStack",
            "cloudformation:DescribeStacks",
            "cloudformation:UpdateStack",
            "cloudformation:CreateChangeSet",
            "cloudformation:DeleteChangeSet",
            "cloudformation:DescribeChangeSet",
            "cloudformation:ExecuteChangeSet",
            "cloudformation:SetStackPolicy",
            "cloudformation:ValidateTemplate",
          ],
          resources: [`arn:aws:cloudformation:${this.cdkUtil.e.regionName}:${this.cdkUtil.e.accountId}:stack/${this.cdkUtil.e.pjCodeName}-${this.cdkUtil.e.envName}-*`],
        }),
        new PolicyStatement({
          actions: [
            "codebuild:BatchGetBuilds",
            "codebuild:StartBuild",
            "codebuild:BatchGetBuildBatches",
            "codebuild:StartBuildBatch",
          ],
          resources: ["*"],
        }),
        new PolicyStatement({
          actions: ["cloudformation:ValidateTemplate"],
          resources: ["*"],
        }),
        new PolicyStatement({
          actions: ["ecr:DescribeImages"],
          resources: ["*"],
        }),
      ],
    });

    // Create the IAM Role for CodePipeline pipelines.
    const iamRoleForPipelineName = this.cdkUtil.naming.generateResourceNameWithRegion(`${namePrefix}-role`)
    const iamRoleForPipeline = new Role(this, pascalCase(iamRoleForPipelineName),{
      roleName: iamRoleForPipelineName,
      path: `/${this.cdkUtil.e.pjCodeName}-${this.cdkUtil.e.envName}/service-role/`,
      assumedBy: new CompositePrincipal(
        new ServicePrincipal('codepipeline.amazonaws.com')
      ),
      inlinePolicies: {[`${namePrefix}-policy`]: iamPolicyDocumentForPipeline}
    })


    // Create the IAM Role for CodeBuild/CodeDeploy.


    return iamRoleForPipeline

  }

}
