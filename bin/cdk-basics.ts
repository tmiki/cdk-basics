#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CicdPipelineStack } from '../lib/stacks/cicd-pipeline-stack';
import { CommonS3bucketStack } from '../lib/stacks/common-s3bucket-stack';
import { VpcNetworkStack } from '../lib/stacks/vpc-network-stack';
import { CdkUtil } from '../utils/cdk-util';
import { ResourceName } from '../utils/resource-name';

const app = new cdk.App();

const env = CdkUtil.E.stackEnvForLocal;

new VpcNetworkStack(app, new ResourceName('vpc').kebabCase(), { env });

new CicdPipelineStack(app, new ResourceName('cicd-pipeline').kebabCase(), { env });

new CommonS3bucketStack(app, new ResourceName('common-s3bucket').kebabCase(), { env });
