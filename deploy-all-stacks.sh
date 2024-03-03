#!/bin/sh

# Check whether necessary environment variables are set.
if [ -z ${AWS_PROFILE} ] || [ -z ${ENV_NAME} ] || [ -z ${PJ_CODE_NAME} ] || [ -z ${CDK_DEFAULT_ACCOUNT} ] || [ -z ${CDK_DEFAULT_REGION} ]; then
    echo "nesessary environment variables are not set."
    exit 1;
fi

echo "continue"

