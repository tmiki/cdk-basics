#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { CicdPipelineStack } from '../lib/stacks/cicd-pipeline-stack';
import { CommonS3bucketStack } from '../lib/stacks/common-s3bucket-stack';
import { EcrStack } from '../lib/stacks/ecr-stack';
import { VpcNetworkStack } from '../lib/stacks/vpc-network-stack';
import { CdkUtil } from '../utils/cdk-util';
import { ResourceName } from '../utils/resource-name';

const app = new App();
const env = CdkUtil.E.stackEnvForLocal;

new VpcNetworkStack(app, new ResourceName('vpc-network').kebabCase(), { env });
new EcrStack(app, new ResourceName('ecr').kebabCase(), { env });
new CicdPipelineStack(app, new ResourceName('cicd-pipeline').kebabCase(), { env });
new CommonS3bucketStack(app, new ResourceName('common-s3bucket').kebabCase(), { env });
