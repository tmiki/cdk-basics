import { Stack, StackProps } from "aws-cdk-lib";
import { CdkUtil } from "../../utils/cdk-util";
import { Construct } from "constructs";
import { S3BucketBaseline } from "../patterns/s3bucket-baseline";
import { pascalCase } from "change-case";

export class CommonS3bucketStack extends Stack {
  private cdkUtil = CdkUtil.getInstance();

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucketName = this.cdkUtil.naming.generateResourceNameWithAccountIdCurrentRegion("examining");
    console.log(`BucketName: ${bucketName}`)
    const s3bucket = new S3BucketBaseline(this, pascalCase(bucketName), {
      bucketName: bucketName,
    });
  }
}
