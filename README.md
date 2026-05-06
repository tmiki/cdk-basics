# Overview

The purpose of this repository is to provide a practical guide and knowledge on how to build a CDK project.

# Implemented Stacks

See [docs/stacks.md](docs/stacks.md).

# Prerequisites

## Things need to be done.

Before you start, ensure you have completed the following steps in advance.

- Create a new AWS account.
- Set up a development environment capable of running AWS CDK v2, which includes:
  - Installing AWS CDK and necessary packages.
  - Configuring your AWS CLI profile.

## Configuration Items you need to decide.

Specify the following information to configure the CDK project.
The first item must be your AWS Account ID, but the others can be named arbitrarily.

- AWS Account ID
- Project Code Name
- Environment Name

# How to deploy

## Initial Setup (Perform once at the beginning.)

### Edit `.envrc`

Modify `.envrc` file to match your environment.

- AWS_PROFILE: Name of your AWS CLI profile.
- PJ_CODE_NAME: The Project Code Name you've decided.
- ENV_NAME: The Environment Name you decided. Choose from: `dev1` / `stg1` / `qas1` / `prd1`
- CDK_DEFAULT_ACCOUNT: AWS Account ID where you want to deploy the stacks.
- CDK_DEFAULT_REGION: AWS region where you want to deploy the stacks.

### Installing Dependencies

Run the following command to install necessary dependencies.

```bash
npm ci
```

### Initializing by `cdk bootstrap` with preparing your environment variables.

Load the environment variables from `.envrc` into the current shell.

```bash
. .envrc
```

Initialize the CDK environment.

```bash
$ cdk bootstrap
 ⏳  Bootstrapping environment aws://123456789012/us-west-2...
Trusted accounts for deployment: (none)
Trusted accounts for lookup: (none)
Using default execution policy of 'arn:aws:iam::aws:policy/AdministratorAccess'. Pass '--cloudformation-execution-policies' to customize.

 ✨ hotswap deployment skipped - no changes were detected (use --force to override)

 ✅  Environment aws://123456789012/us-west-2 bootstrapped (no changes).
```

## Deploy stacks

### Deploying changes.

After setting up, deploy your CDK stacks as follows:

Load the environment variables.
You don't need it unless you closed the terminal where you performed the initial setup.

```bash
. .envrc
```

Preview changes with `cdk diff`.

```bash
cdk diff ${PJ_CODE_NAME}-${ENV_NAME}-vpc
```

Deploy your changes using `cdk deploy`.

```bash
cdk deploy ${PJ_CODE_NAME}-${ENV_NAME}-vpc
cdk deploy ${PJ_CODE_NAME}-${ENV_NAME}-cicd-pipeline
cdk deploy ${PJ_CODE_NAME}-${ENV_NAME}-common-s3bucket
```

For example, with `PJ_CODE_NAME=cdkbasics` and `ENV_NAME=dev1`:

```bash
cdk deploy cdkbasics-dev1-vpc
cdk deploy cdkbasics-dev1-cicd-pipeline
cdk deploy cdkbasics-dev1-common-s3bucket
```

## Running tests

```bash
npm test
```
