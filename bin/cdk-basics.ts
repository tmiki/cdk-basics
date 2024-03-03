#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkBasicsStack } from '../lib/cdk-basics-stack';

const app = new cdk.App();
new CdkBasicsStack(app, 'CdkBasicsStack');
