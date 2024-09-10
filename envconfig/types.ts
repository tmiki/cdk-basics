import { RemovalPolicy } from 'aws-cdk-lib';

export type RemovalPoliciesConfig = {
  permanentDatastore: {
    s3: RemovalPolicy;
    rds: RemovalPolicy;
    dynamodb: RemovalPolicy;
  };
  logs: {
    cloudWatchLogs: RemovalPolicy;
  };
}

export type VpcConfig = {
  cidr: string;
  natGateways: number;
}

export type GitRepository = {
  owner: string;
  name: string;
  branch: string;
}

export type App = {
  type: string;
  gitRepository: GitRepository;
}

export type CicdPipelineConfig = {
  apps: {
    [key: string]: App;
  };
}

export type EcrRepositoryConfig = {
  lifecycleRules: {
    maxImageCount: number;
  };
}

export type CostBudgets = {
  monthlyBudget: {
    budgetAmountUSD: number;
    notificationThresholdPercent: {
      forecast: number;
      actual: number;
    };
  };
}

export type EnvConfig = {
  removalPolicies: RemovalPoliciesConfig;
  vpc: VpcConfig;
  cicdPipeline: CicdPipelineConfig;
  ecrRepository: EcrRepositoryConfig;
  costBudgets: CostBudgets;
}

// EnvConfigのキーを1階層目に指定可能にするための型
export type EnvConfigKey = keyof EnvConfig;
