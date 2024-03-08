import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { CdkUtil } from "../../utils/cdk-util";
import { Construct } from "constructs";
import { S3BucketBaseline } from "../patterns/s3bucket-baseline";
import { pascalCase } from "change-case";

export class CommonS3bucketStack extends Stack {
  private cdkUtil = CdkUtil.getInstance();

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html
    const bucketName = this.cdkUtil.naming.generateResourceNameWithAccountIdCurrentRegion("examining");
    const s3bucket = new S3BucketBaseline(this, pascalCase(bucketName), {
      bucketName: bucketName,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
