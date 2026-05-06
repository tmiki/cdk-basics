# AGENTS.md

This file provides context for AI agents working on this codebase.

## Project Overview

AWS CDK v2 project (TypeScript) that implements foundational AWS infrastructure as a practical learning reference. It defines multiple stacks across multiple environments with shared naming conventions and utility abstractions.

## Repository Structure

```
cdk-basics/
├── bin/
│   └── cdk-basics.ts        # CDK app entry point — instantiates all stacks
├── lib/
│   ├── stacks/              # Stack definitions (one file per stack)
│   │   ├── vpc-network-stack.ts
│   │   ├── common-s3bucket-stack.ts
│   │   └── cicd-pipeline-stack.ts
│   └── patterns/            # L3 constructs (project-baseline extensions)
│       └── s3bucket-baseline.ts
├── envconfig/               # Per-environment configuration values
│   ├── types.ts             # EnvConfig type definitions
│   ├── env-dev1.ts
│   ├── env-stg1.ts
│   ├── env-qas1.ts
│   ├── env-prd1.ts
│   └── env-test.ts
├── utils/                   # Utility classes
│   ├── cdk-util.ts          # Static facade — main entry point for utilities
│   ├── project-environment.ts
│   ├── resource-name.ts
│   ├── lookup-util.ts
│   └── debug-out-util.ts
├── docs/                    # Project documentation
│   └── stacks.md            # Implemented stacks overview
├── debug_out/               # Debug output directory (IAM policy JSON dumps, etc.)
├── .envrc                   # Environment variables (not committed; copy from .envrc.sample)
├── .envrc.sample            # Template for .envrc
└── deploy-all-stacks.sh     # Helper script to validate env vars before deploying
```

## Stacks

For a summary table, see [docs/stacks.md](docs/stacks.md).

### VpcNetworkStack (`lib/stacks/vpc-network-stack.ts`)
Creates a VPC with the following layout:
- 3 active AZs + 1 reserved AZ (`maxAzs: 3`, `reservedAzs: 1`)
- Subnets: `public`, `public-reserved` (reserved), `private`, `private-reserved` (reserved), `isolated`, `isolated-reserved` (reserved)
- NAT: uses either a NAT instance (t2.micro, AL2023) or NAT Gateway depending on `vpc.useNatInstance` in env config
- Exports the VPC ID to SSM Parameter Store: `/{pjCodeName}/{envName}/vpc-id`

### CommonS3bucketStack (`lib/stacks/common-s3bucket-stack.ts`)
Creates a single general-purpose S3 bucket using the `S3BucketBaseline` L3 pattern. Bucket name includes account ID and region for global uniqueness.

### CicdPipelineStack (`lib/stacks/cicd-pipeline-stack.ts`)
Creates a CodePipeline V2 pipeline connected to GitHub via CodeStar Connections (GitHub Apps). Pipeline stages:
1. **SourceStage** — pulls source from GitHub repo defined in `cicdPipeline.apps.examining`
2. **DeployStage** — deploys artifacts to a destination S3 bucket

Creates two IAM roles with least-privilege inline/managed policies:
- Pipeline role (assumed by `codepipeline.amazonaws.com`)
- Stages role (assumed by the pipeline role and `codebuild.amazonaws.com`)

## Patterns

### S3BucketBaseline (`lib/patterns/s3bucket-baseline.ts`)
Extends `aws-cdk-lib/aws-s3.Bucket`. Enforces `versioned: true` as a project default. All other props can be overridden by callers.

## Utilities

### CdkUtil (`utils/cdk-util.ts`)
Static class. Aggregates all utilities. Use this in stacks rather than accessing utilities directly.

| Member | Type | Description |
|---|---|---|
| `CdkUtil.e` | `typeof ProjectEnvironment` | Reference to the `ProjectEnvironment` static class |
| `CdkUtil.envConfig` | `EnvConfig` | Per-environment config object (lazy-loaded) |
| `CdkUtil.lookup` | `LookupUtil` | CDK lookup helpers (lazy-loaded) |
| `CdkUtil.debugOut` | `DebugOutUtil` | Debug file writer (lazy-loaded) |

Key methods:
- `CdkUtil.getEnvConfig('vpc')` — returns the typed env config section
- `CdkUtil.getResourceName('my-resource')` — returns a `ResourceName` with `.pascalCase`, `.kebabCase`, `.snakeCase`

### ProjectEnvironment (`utils/project-environment.ts`)
Static class. Reads env vars once on first access (lazy initialization).

| Member | Description |
|---|---|
| `ProjectEnvironment.envName` | Value of `ENV_NAME` env var |
| `ProjectEnvironment.pjCodeName` | Value of `PJ_CODE_NAME` env var |
| `ProjectEnvironment.accountId` | Value of `CDK_DEFAULT_ACCOUNT` env var |
| `ProjectEnvironment.regionName` | Value of `CDK_DEFAULT_REGION` env var |
| `ProjectEnvironment.environmentPassingInStack` | `{ account, region }` object for CDK stack `env:` prop |

### ResourceName (`utils/resource-name.ts`)
Merges former `NamingUtil` and `ResourceNameString`. Wraps a single resource name keyword and exposes it in multiple case styles and suffixing patterns.

```typescript
const n = CdkUtil.getResourceName('my-role');
// or: const n = new ResourceName('my-role');
n.kebabCase              // "cdkbasics-dev1-my-role"
n.pascalCase             // "CdkbasicsDev1MyRole"
n.snakeCase              // "cdkbasics_dev1_my_role"
n.kebabCaseWithRegion    // "cdkbasics-dev1-my-role-us-west-2"
n.kebabCaseWithAccountId // "cdkbasics-dev1-my-role-123456789012-us-west-2"
n.getNameForSpecificRegion('eu-west-1')  // "cdkbasics-dev1-my-role-123456789012-eu-west-1"

ResourceName.parameterStoreName('vpc-id')  // "/cdkbasics/dev1/vpc-id"
```

## Environment Configuration

Environments: `dev1`, `stg1`, `qas1`, `prd1`. Each has its own file under `envconfig/`.

Config shape (`EnvConfig` in `envconfig/types.ts`):

```typescript
{
  removalPolicies: { permanentDatastore: { s3, rds, dynamodb }, logs: { cloudWatchLogs } }
  vpc: { cidr, natGateways, useNatInstance }
  cicdPipeline: { apps: { [key]: { type, gitRepository: { owner, name, branch } } } }
  ecrRepository: { lifecycleRules: { maxImageCount } }
  costBudgets: { monthlyBudget: { budgetAmountUSD, notificationThresholdPercent: { forecast, actual } } }
}
```

Notable differences across environments:
- **dev1**: NAT instance (cost-saving), 1 NAT gateway, `RemovalPolicy.DESTROY` everywhere
- **stg1**: NAT Gateway (not NAT instance), 3 NAT gateways

## Required Environment Variables

Set these in `.envrc` (copy from `.envrc.sample`):

| Variable | Example | Description |
|---|---|---|
| `AWS_PROFILE` | `myprofile` | AWS CLI profile |
| `ENV_NAME` | `dev1` | Selects the env config (dev1 / stg1 / qas1 / prd1) |
| `PJ_CODE_NAME` | `cdkbasics` | Short project code; used in all resource names |
| `CDK_DEFAULT_ACCOUNT` | `123456789012` | Target AWS account ID |
| `CDK_DEFAULT_REGION` | `us-west-2` | Target AWS region |

Load with `. .envrc` before running any CDK commands.

## Common Commands

```bash
# Load environment variables
. .envrc

# Install dependencies
npm install

# Bootstrap CDK (once per account/region)
cdk bootstrap

# Preview changes
cdk diff <stack-name>

# Deploy a single stack
cdk deploy <stack-name>

# Build TypeScript
npm run build

# Run tests
npm test
```

Stack names follow the naming convention: e.g., `cdkbasics-dev1-vpc`, `cdkbasics-dev1-cicd-pipeline`, `cdkbasics-dev1-common-s3bucket`.

## Conventions and Patterns

- **Static utility**: Use `CdkUtil` directly as a static class — no instantiation needed.
- **Resource naming**: Use `CdkUtil.getResourceName(keyword)` (or `new ResourceName(keyword)`) for names needed in both CDK construct IDs (PascalCase) and AWS resource names (kebab-case). Use `ResourceName.parameterStoreName(keyword)` for SSM Parameter Store paths.
- **L3 patterns**: Project-specific baseline constructs live in `lib/patterns/`. Add new ones there when enforcing project-wide defaults on a resource type.
- **Stack isolation**: Each stack has a single responsibility. Cross-stack references use SSM Parameter Store (not CloudFormation exports) to avoid tight coupling.
- **Debug output**: `util.debugOut.writeJsonFile(path, json)` dumps intermediate values (e.g., IAM policy JSON) to `debug_out/` for inspection during development.
- **No tests yet**: `test/cdk-basics.test.ts` is fully commented out. Write CDK assertion tests using `aws-cdk-lib/assertions` when adding new stacks.
