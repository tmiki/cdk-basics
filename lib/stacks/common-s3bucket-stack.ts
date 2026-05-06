import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CdkUtil } from '../../utils/cdk-util';
import { S3BucketBaseline } from '../patterns/s3bucket-baseline';

export class CommonS3bucketStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html
    const s3BucketName = CdkUtil.getResourceName('common');
    const s3bucket = new S3BucketBaseline(this, s3BucketName.constructId(), {
      bucketName: s3BucketName.kebabCaseWithRegion(),
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
