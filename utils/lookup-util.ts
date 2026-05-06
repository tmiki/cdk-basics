import { Construct } from 'constructs/lib/construct';
import { Vpc } from 'aws-cdk-lib/aws-ec2';

export class LookupUtil {
  // Retrieve a Vpc object by specifying its name.
  // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html#static-fromwbrlookupscope-id-options
  public getVpcByName(scope: Construct, id: string, vpcName: string): Vpc {
    return <Vpc>Vpc.fromLookup(scope, id, {
      vpcName: vpcName,
    });
  }
}
