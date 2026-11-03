// utils/project-environment.ts reads these on module load, so they must be set before any stack is imported.
process.env.ENV_NAME = 'test';
process.env.PJ_CODE_NAME = 'cdkbasics';
process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
process.env.CDK_DEFAULT_REGION = 'us-west-2';
process.env.DEBUG_ENABLED = 'false';
