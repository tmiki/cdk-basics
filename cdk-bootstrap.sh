#!/usr/bin/env bash
set -euo pipefail

# cdk bootstrap実行
cdk bootstrap aws://${CDK_DEFAULT_ACCOUNT}/${CDK_DEFAULT_REGION} --termination-protection --qualifier cdkbasics
cdk bootstrap aws://${CDK_DEFAULT_ACCOUNT}/us-east-1 --termination-protection --qualifier cdkbasics

