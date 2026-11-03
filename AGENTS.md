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
│   ├── resource-name-types.ts # Enums: RegionShortNames, ParameterStorePartialKey, LogGroupPrefix, etc.
│   ├── lookup-util.ts
│   └── debug-out-util.ts
├── test/
│   ├── setup-env.ts         # Sets env vars (ENV_NAME=test, etc.) before tests import any stack
│   └── cdk-basics.test.ts   # CDK assertion tests for all stacks
├── docs/                    # Project documentation
│   └── stacks.md            # Implemented stacks overview
├── debug_out/               # Debug output directory (IAM policy JSON dumps, etc.)
├── .envrc                   # Environment variables (not committed; copy from .envrc.sample)
├── .envrc.sample            # Template for .envrc
├── mise.toml                # Tool versions (Node, CDK CLI, TypeScript) managed by mise
└── deploy-all-stacks.sh     # Deploy helper (outdated: references a `cdk/` subdirectory and an `ecr` stack that do not exist yet)
```

## Stacks

For a summary table, see [docs/stacks.md](docs/stacks.md).

### VpcNetworkStack (`lib/stacks/vpc-network-stack.ts`)
Creates a VPC with the following layout:
- 3 active AZs + 1 reserved AZ (`maxAzs: 3`, `reservedAzs: 1`)
- Subnets: `public`, `public-reserved` (reserved), `private`, `private-reserved` (reserved), `isolated`, `isolated-reserved` (reserved)
- NAT: uses either a NAT instance (t2.micro, AL2023) or NAT Gateway depending on `vpc.useNatInstance` in env config
- Exports the VPC ID to SSM Parameter Store: `/{PJ_CODE_NAME}/{ENV_NAME}/cdk/vpc/id` (via `ResourceName.parameterStoreName(ParameterStorePartialKey.VPC_ID)`)

### CommonS3bucketStack (`lib/stacks/common-s3bucket-stack.ts`)
Creates a single general-purpose S3 bucket using the `S3BucketBaseline` L3 pattern. Bucket name includes the shortened region name (e.g., `cdkbasics-dev1-common-usw2`) via `kebabCaseWithRegion()`.

### CicdPipelineStack (`lib/stacks/cicd-pipeline-stack.ts`)
Creates a CodePipeline V2 pipeline connected to GitHub via a CodeConnections connection (`aws-codeconnections.CfnConnection`, GitHub Apps). The connection name must not exceed 32 characters (checked at synth time). Pipeline stages:
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
| `CdkUtil.E` | `typeof ProjectEnvironment` | Reference to the `ProjectEnvironment` static class |
| `CdkUtil.envConfig` | `EnvConfig` | Per-environment config object (lazy-loaded) |
| `CdkUtil.lookup` | `ResourceLookup` | CDK lookup helpers (lazy-loaded). Note: its methods are currently `static`, so call `ResourceLookup.getSsmParameterValue(...)` etc. |
| `CdkUtil.debugOut` | `DebugOutUtil` | Debug file writer (lazy-loaded) |

Key methods:
- `CdkUtil.getEnvConfig('vpc')` — returns the typed env config section
- `CdkUtil.getResourceName('my-resource')` — returns a `ResourceName` (see below)

### ProjectEnvironment (`utils/project-environment.ts`)
Static class. Reads env vars in a `static {}` block, i.e. **at module load time**. Importing it (directly or via `CdkUtil` / any stack) throws if a required env var is missing or `ENV_NAME` is not one of `dev1`, `stg1`, `qas1`, `prd1`, `test`.

| Member | Description |
|---|---|
| `ProjectEnvironment.ENV_NAME` | Value of `ENV_NAME` env var |
| `ProjectEnvironment.PJ_CODE_NAME` | Value of `PJ_CODE_NAME` env var |
| `ProjectEnvironment.ACCOUNT_ID` | Value of `CDK_DEFAULT_ACCOUNT` env var |
| `ProjectEnvironment.REGION_NAME` | Value of `CDK_DEFAULT_REGION` env var |
| `ProjectEnvironment.DEBUG_ENABLED` | `true` when `DEBUG_ENABLED=true` |
| `ProjectEnvironment.GLOBAL_REGION_NAME` | `us-east-1` |
| `ProjectEnvironment.stackEnvForLocal` | `{ account, region }` for the CDK stack `env:` prop (current region) |
| `ProjectEnvironment.stackEnvForGlobal` | `{ account, region }` for the CDK stack `env:` prop (`us-east-1`) |

### ResourceName (`utils/resource-name.ts`)
Wraps a single resource name keyword and exposes it in multiple case styles and suffixing patterns. All members are **methods** (call with `()`). Region suffixes use the shortened name from `RegionShortNames` by default (e.g., `us-west-2` → `usw2`); pass `RegionNameType.FULL` for the full name. A region missing from `RegionShortNames` throws.

```typescript
const n = CdkUtil.getResourceName('my-role');
// or: const n = new ResourceName('my-role');
n.constructId()                           // "MyRole"  (keyword only; use for construct IDs)
n.kebabCase()                             // "cdkbasics-dev1-my-role"  (also: n.resourceName())
n.pascalCase()                            // "CdkbasicsDev1MyRole"
n.snakeCase()                             // "cdkbasics_dev1_my_role"
n.kebabCaseWithRegion()                   // "cdkbasics-dev1-my-role-usw2"
n.kebabCaseWithRegion(RegionNameType.FULL) // "cdkbasics-dev1-my-role-us-west-2"
n.kebabCaseWithAccountIdAndRegion()       // "cdkbasics-dev1-my-role-123456789012-usw2"
// Also: pascalCaseWithRegion(), snakeCaseWithRegion(), pascalCaseWithAccountId()

ResourceName.parameterStoreName(ParameterStorePartialKey.VPC_ID)   // "/cdkbasics/dev1/cdk/vpc/id"
ResourceName.buildLogGroupName('my-func', LogGroupPrefix.LAMBDA)   // "/aws/lambda/cdkbasics-dev1-my-func"
```

## Environment Configuration

Environments: `dev1`, `stg1`, `qas1`, `prd1`, plus `test` (used by unit tests). Each has its own file under `envconfig/` and must be registered in `allEnvConfigs` in `utils/cdk-util.ts`.

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
- **dev1**: NAT instance (cost-saving), 1 NAT gateway
- **stg1 / qas1 / prd1 / test**: NAT Gateway (not NAT instance), 3 NAT gateways
- All environments currently use `RemovalPolicy.DESTROY` everywhere
- `cicdPipeline.apps.examining` is required by `CicdPipelineStack` (present in `dev1` and `test`)

## Required Environment Variables

Set these in `.envrc` (copy from `.envrc.sample`):

| Variable | Example | Description |
|---|---|---|
| `AWS_PROFILE` | `myprofile` | AWS CLI profile |
| `ENV_NAME` | `dev1` | Selects the env config (dev1 / stg1 / qas1 / prd1) |
| `PJ_CODE_NAME` | `cdkbasics` | Short project code; used in all resource names |
| `CDK_DEFAULT_ACCOUNT` | `123456789012` | Target AWS account ID |
| `CDK_DEFAULT_REGION` | `us-west-2` | Target AWS region (must be listed in `RegionShortNames`) |
| `DEBUG_ENABLED` | `true` | Optional. Enables debug output to `debug_out/` |

Load with `. .envrc` before running any CDK commands.

## Common Commands

Tool versions (Node, CDK CLI, TypeScript) are pinned in `mise.toml`. Upgrade the CDK CLI with `mise use npm:aws-cdk@latest` **before** upgrading `aws-cdk-lib` (pinned exactly in `package.json`), since a newer library may require a newer CLI.

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
- **Resource naming**: Use `CdkUtil.getResourceName(keyword)` (or `new ResourceName(keyword)`); pass `.constructId()` as the construct ID and `.kebabCase()` (or a `WithRegion` variant) as the AWS resource name. Use `ResourceName.parameterStoreName(ParameterStorePartialKey.X)` for SSM Parameter Store paths (add new keys to the enum in `utils/resource-name-types.ts`).
- **L3 patterns**: Project-specific baseline constructs live in `lib/patterns/`. Add new ones there when enforcing project-wide defaults on a resource type.
- **Stack isolation**: Each stack has a single responsibility. Cross-stack references use SSM Parameter Store (not CloudFormation exports) to avoid tight coupling.
- **Debug output**: `CdkUtil.debugOut.writeJsonFile(path, json)` dumps intermediate values (e.g., IAM policy JSON) to `debug_out/` for inspection during development. It is a no-op unless `DEBUG_ENABLED=true`.
- **Tests**: `test/cdk-basics.test.ts` contains CDK assertion tests (`aws-cdk-lib/assertions`) for every stack, run against the `test` env config (env vars are set in `test/setup-env.ts` via jest `setupFiles`). No AWS access is required. Add tests there when adding or changing stacks. `jest.config.js` prefers `.ts` over compiled `.js` so stale build output is not picked up.
