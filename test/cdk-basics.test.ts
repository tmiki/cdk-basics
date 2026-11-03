import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { CicdPipelineStack } from '../lib/stacks/cicd-pipeline-stack';
import { CommonS3bucketStack } from '../lib/stacks/common-s3bucket-stack';
import { VpcNetworkStack } from '../lib/stacks/vpc-network-stack';
import { CdkUtil } from '../utils/cdk-util';

// Environment variables are set in test/setup-env.ts (ENV_NAME=test).
const env = CdkUtil.E.stackEnvForLocal;

describe('VpcNetworkStack', () => {
  const vpcConfig = CdkUtil.getEnvConfig('vpc');
  const template = Template.fromStack(new VpcNetworkStack(new App(), 'TestVpcStack', { env }));

  test('creates a single VPC with the configured CIDR', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: vpcConfig.cidr,
    });
  });

  test('exports the VPC ID to SSM Parameter Store', () => {
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/cdkbasics/test/cdk/vpc/id',
      Type: 'String',
      Value: { Ref: Match.anyValue() },
    });
  });

  test('creates NAT gateways according to the env config', () => {
    expect(vpcConfig.useNatInstance).toBe(false);
    template.resourceCountIs('AWS::EC2::NatGateway', vpcConfig.natGateways);
    template.resourceCountIs('AWS::EC2::Instance', 0);
  });
});

describe('CommonS3bucketStack', () => {
  const template = Template.fromStack(new CommonS3bucketStack(new App(), 'TestCommonS3bucketStack', { env }));

  test('creates a versioned bucket named with region', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'cdkbasics-test-common-usw2',
      VersioningConfiguration: { Status: 'Enabled' },
    });
  });
});

describe('CicdPipelineStack', () => {
  const template = Template.fromStack(new CicdPipelineStack(new App(), 'TestCicdPipelineStack', { env }));

  test('creates a V2 pipeline with Source and Deploy stages', () => {
    template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Name: 'cdkbasics-test-examining-cicd-with-github',
      PipelineType: 'V2',
      Stages: [Match.objectLike({ Name: 'SourceStage' }), Match.objectLike({ Name: 'DeployStage' })],
    });
  });

  test('creates a GitHub connection', () => {
    template.resourceCountIs('AWS::CodeConnections::Connection', 1);
    template.hasResourceProperties('AWS::CodeConnections::Connection', {
      ConnectionName: 'cdkbasics-test-examining-conn',
      ProviderType: 'GitHub',
    });
  });

  test('creates the pipeline role and the stages role', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'cdkbasics-test-examining-cicd-pipeline-role',
    });
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'cdkbasics-test-examining-cicd-stage-role',
    });
  });
});
