#!/usr/bin/env bash
set -euo pipefail

# Check whether necessary environment variables are set.
if [ -z ${AWS_PROFILE} ] || [ -z ${ENV_NAME} ] || [ -z ${PJ_CODE_NAME} ] || [ -z ${CDK_DEFAULT_ACCOUNT} ] || [ -z ${CDK_DEFAULT_REGION} ]; then
    echo "necessary environment variables are not set."
    exit 1;
fi

echo "continue"

cd ./cdk/

echo "continue"

# Initialize local environment.
rm -f cdk.context.json
npm ci
npm run build
cdk ls

# Create ECR repositories at first.
cdk deploy --require-approval never ${PJ_CODE_NAME}-${ENV_NAME}-ecr

# push an arbitrary image to the ECR repositories created above.
## pull the hello-world image.
docker image pull public.ecr.aws/docker/library/hello-world:linux

## build the string of the ECR repository base URI.
ECR_URI_DOMAIN_NAME=${CDK_DEFAULT_ACCOUNT}.dkr.ecr.${CDK_DEFAULT_REGION}.amazonaws.com

## login to the ECR service.
aws ecr get-login-password --region ${CDK_DEFAULT_REGION} | docker login --username AWS --password-stdin ${ECR_URI_DOMAIN_NAME}

## Push the image to the "ecr-webapi".
docker image tag public.ecr.aws/docker/library/hello-world:linux ${ECR_URI_DOMAIN_NAME}/${PJ_CODE_NAME}-${ENV_NAME}-ecr-webapi:latest
docker image push ${ECR_URI_DOMAIN_NAME}/${PJ_CODE_NAME}-${ENV_NAME}-ecr-webapi:latest

### Put the image URI to the Secrets Manager Secret.
aws secretsmanager put-secret-value --secret-id ${PJ_CODE_NAME}-${ENV_NAME}-ecr-webapi-latest-image-uri-secret --secret-string "${ECR_URI_DOMAIN_NAME}/${PJ_CODE_NAME}-${ENV_NAME}-ecr-webapi:latest"

# Deploy all the rest of the stacks in a parallel manner taking account of the stack dependencies.
cdk deploy --all --concurrency 8 --require-approval never
