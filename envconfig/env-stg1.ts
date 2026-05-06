import { RemovalPolicy } from 'aws-cdk-lib';
import { EnvConfig } from './types';

export const EnvConfigStg1: EnvConfig = {
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
    useNatInstance: false,
  },
  cicdPipeline: {
    apps: {
      frontend: {
        type: 'frontend',
        gitRepository: {
          owner: 'tmiki',
          name: 'cdk-basics-frontend-sample',
          branch: 'main',
        },
      },
      backend: {
        type: 'backend',
        gitRepository: {
          owner: 'tmiki',
          name: 'cdk-basics-backend-sample',
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
