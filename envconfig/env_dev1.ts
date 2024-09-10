import { RemovalPolicy } from 'aws-cdk-lib';
import { EnvConfig } from './types';

export const EnvConfigDev1: EnvConfig = {
  removalPolicies: {
    permanentDatastore: {
      s3: RemovalPolicy.DESTROY,
      dynamodb: RemovalPolicy.DESTROY,
      rds: RemovalPolicy.DESTROY,
    },
    logs: {
      cloudWatchLogs: RemovalPolicy.DESTROY,
    },
  },
  vpc: {
    cidr: '172.16.0.0/19',
    natGateways: 3,
    useNatInstance: true,
  },
  cicdPipeline: {
    apps: {
      examining: {
        type: 'backend',
        gitRepository: {
          owner: 'tmiki',
          name: 'examining-cicd-with-github',
          branch: 'main',
        },
      },
    },
  },
  ecrRepository: {
    lifecycleRules: {
      maxImageCount: 20,
    },
  },
  costBudgets: {
    monthlyBudget: {
      budgetAmountUSD: 2,
      notificationThresholdPercent: {
        forecast: 100,
        actual: 60,
      },
    },
  },
};
