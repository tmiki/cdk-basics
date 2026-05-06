import { Bucket, BucketProps } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html
// https://docs.aws.amazon.com/prescriptive-guidance/latest/aws-cdk-layers/layer-3.html#l3-resource-extensions
export class S3BucketBaseline extends Bucket {
  constructor(scope: Construct, id: string, props: Partial<BucketProps> = {}) {
    super(scope, id, {
      // Specify the default properties as the project baseline policy.
      versioned: true,

      // Combine other properties.
      ...props,
    });
  }
}
