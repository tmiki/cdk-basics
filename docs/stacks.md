# Implemented Stacks

| Stack | Description |
| --- | --- |
| `vpc` | VPC with public / private / isolated subnets across 3 AZs. Supports NAT instance or NAT Gateway. |
| `cicd-pipeline` | CodePipeline V2 connected to GitHub via CodeStar Connections, with an S3 deploy stage. |
| `common-s3bucket` | General-purpose S3 bucket with versioning enabled. |

Stack names follow the pattern `{PJ_CODE_NAME}-{ENV_NAME}-{stack}` (e.g., `cdkbasics-dev1-vpc`).
