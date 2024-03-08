#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcNetworkStack } from '../lib/stacks/vpc-network-stack';
import { CdkUtil } from '../utils/cdk-util';
import { CommonS3bucketStack } from '../lib/stacks/common-s3bucket-stack';

const cdkUtil = CdkUtil.getInstance();

const app = new cdk.App();

const vpcNetworkStackName = cdkUtil.naming.generateResourceName('vpc');
new VpcNetworkStack(app, vpcNetworkStackName, {env: cdkUtil.e.environmentPassingInStack});

new CommonS3bucketStack(app, cdkUtil.naming.generateResourceName('common-s3bucket'), {env: cdkUtil.e.environmentPassingInStack});

