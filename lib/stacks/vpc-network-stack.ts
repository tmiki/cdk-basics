// import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { CdkUtil } from '../../utils/cdk-util';
import { pascalCase } from 'change-case';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export class VpcNetworkStack extends Stack {
  private util = CdkUtil.getInstance();

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    let vpcConfig = this.util.getEnvConfig('vpc');

    // Creating a VPC and belonging resources.
    //
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.SubnetConfiguration.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.SubnetType.html

    // Build the VPC Construct props with basic settings.
    const vpcPropsBase = {
      vpcName: id,
      ipAddresses: ec2.IpAddresses.cidr(vpcConfig.cidr),
      maxAzs: 3,
      reservedAzs: 1,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'public-reserved',
          subnetType: ec2.SubnetType.PUBLIC,
          reserved: true,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          name: 'private-reserved',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          reserved: true,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          name: 'isolated-reserved',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          reserved: true,
        },
      ],
      restrictDefaultSecurityGroup: false,
      natGateways: vpcConfig.natGateways,
    };

    let vpcProps;
    // Create NAT instance(s) if the "vpc.useNatInstance" is true.
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.NatProvider.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.NatInstanceProviderV2.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.IMachineImage.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.MachineImage.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.AmazonLinux2023ImageSsmParameterProps.html
    if (vpcConfig.useNatInstance) {
      const natInstanceKeyName = this.util.getResourceNameString('nat-instance-key');
      const natInstanceProvider = ec2.NatProvider.instanceV2({
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
        keyPair: ec2.KeyPair.fromKeyPairName(this, natInstanceKeyName.pascalCase, natInstanceKeyName.kebabCase),
      });

      vpcProps = {
        ...vpcPropsBase,
        natGatewayProvider: natInstanceProvider,
      };
    } else {
      vpcProps = vpcPropsBase;
    }

    // Create a VPC in practice.
    const vpc = new ec2.Vpc(this, pascalCase(id), vpcProps);

    // Put the VPC ID into SSM Parameter Store instead of Output.
    new StringParameter(this, 'VpcIdParameter', {
      parameterName: this.util.naming.generateParameterStoreName('vpc-id'),
      stringValue: vpc.vpcId,
    });
  }
}
