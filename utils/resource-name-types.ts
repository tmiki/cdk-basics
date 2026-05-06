// リージョン名を短縮形にするかどうかの指定
export enum RegionNameType {
  SHORTENED = 1,
  FULL = 2,
}

// リージョン名の短縮形
// https://docs.aws.amazon.com/ja_jp/workspaces/latest/adminguide/azs-workspaces.html
export enum RegionShortNames {
  'us-east-1' = 'use1',
  'us-east-2' = 'use2',
  'us-west-1' = 'usw1',
  'us-west-2' = 'usw2',
  'ap-northeast-1' = 'apne1',
  'ap-northeast-2' = 'apne2',
  'ap-northeast-3' = 'apne3',
  'ap-southeast-1' = 'apse1',
  'ap-southeast-2' = 'apse2',
  'eu-west-1' = 'euw1',
  'eu-west-2' = 'euw2',
  'eu-west-3' = 'euw3',
  'eu-north-1' = 'eun1',
  'ca-central-1' = 'cac1',
  'eu-central-1' = 'euc1',
  // 他のリージョンも必要に応じて追加
}

export enum LogGroupPrefix {
  API_GATEWAY = '/aws/apigateway',
  LAMBDA = '/aws/lambda',
  ECS = '/aws/ecs',
  RDS_PROXY = '/aws/rds/proxy',
  CODEBUILD = '/aws/codebuild',
  SSM = '/aws/ssm',
}

export enum ParameterStorePartialKey {
  // VPC
  VPC_ID = 'vpc/id',
  // ACM Certificates
  ACM_GLOBAL_CERT_ARN = 'acm/global-cert/arn',
  ACM_REGIONAL_CERT_ARN = 'acm/regional-cert/arn',
}
