// import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType, IpAddresses, NatProvider, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { CdkUtil } from '../../utils/cdk-util';
import { ResourceName } from '../../utils/resource-name';
import { ParameterStorePartialKey } from '../../utils/resource-name-types';

export class VpcNetworkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    let vpcConfig = CdkUtil.getEnvConfig('vpc');

    // Creating a VPC and belonging resources.
    //
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.SubnetConfiguration.html
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.SubnetType.html

    // Build the VPC Construct props with basic settings.
    const vpcPropsBase = {
      vpcName: id,
      ipAddresses: IpAddresses.cidr(vpcConfig.cidr),
      maxAzs: 3,
      reservedAzs: 1,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: 'public-reserved',
          subnetType: SubnetType.PUBLIC,
          reserved: true,
        },
        {
          name: 'private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          name: 'private-reserved',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          reserved: true,
        },
        {
          name: 'isolated',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        {
          name: 'isolated-reserved',
          subnetType: SubnetType.PRIVATE_ISOLATED,
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
      const natInstanceProvider = NatProvider.instanceV2({
        instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      });

      vpcProps = {
        ...vpcPropsBase,
        natGatewayProvider: natInstanceProvider,
      };
    } else {
      vpcProps = vpcPropsBase;
    }

    // Create a VPC in practice.
    const vpcName = CdkUtil.getResourceName('vpc');
    const vpc = new Vpc(this, vpcName.constructId(), vpcProps);

    // Put the VPC ID into SSM Parameter Store instead of Output.
    new StringParameter(this, 'ParameterVpcId', {
      parameterName: ResourceName.parameterStoreName(ParameterStorePartialKey.VPC_ID),
      stringValue: vpc.vpcId,
    });
  }
}
