#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcNetworkStack } from '../lib/stacks/vpc-network-stack';
import { CdkUtil } from '../utils/cdk-util';
import { CommonS3bucketStack } from '../lib/stacks/common-s3bucket-stack';
import { CicdPipelineStack } from '../lib/stacks/cicd-pipeline-stack';

const util = CdkUtil.getInstance();

const app = new cdk.App();

const vpcNetworkStackName = util.naming.generateResourceName('vpc');
new VpcNetworkStack(app, vpcNetworkStackName, {env: util.e.environmentPassingInStack});

new CicdPipelineStack(app, util.naming.generateResourceName('cicd-pipeline'), {env: util.e.environmentPassingInStack});

new CommonS3bucketStack(app, util.naming.generateResourceName('common-s3bucket'), {env: util.e.environmentPassingInStack});

