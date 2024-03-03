#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcNetworkStack } from '../lib/stacks/vpc-network-stack';
import { CdkUtil } from '../utils/cdk-util';

const cdkUtil = CdkUtil.getInstance();

console.log(cdkUtil.e.environmentPassingInStack);

const app = new cdk.App();
const vpcNetworkStackName = cdkUtil.naming.generateResourceName('vpc');
console.log ("VPC Stack Name: " + vpcNetworkStackName)

new VpcNetworkStack(app, vpcNetworkStackName, {env: cdkUtil.e.environmentPassingInStack});


