import * as core from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'

interface Props extends core.StackProps {
  bucketName: string
  distributionId: string
  projectNameTag: string
  projectId: string
}

export class AWSCloudFrontClientDeployStack extends core.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props)
    // CloudFront オリジン用のS3バケットを取得
    const bucket = s3.Bucket.fromBucketName(
      this,
      props.bucketName,
      props.bucketName,
    )

    // CloudFrontディストリビューションを取得
    const distribution = cf.Distribution.fromDistributionAttributes(
      this,
      props.distributionId,
      {
        domainName: '',
        distributionId: props.distributionId,
      },
    )
    // 指定したディレクトリをデプロイ
    this.deployS3(bucket, distribution, '../client/public', props.bucketName)

    core.Tags.of(this).add('Project', props.projectNameTag)
  }

  private deployS3(
    siteBucket: s3.IBucket,
    distribution: cf.IDistribution,
    sourcePath: string,
    bucketName: string,
  ) {
    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(
      this,
      `${bucketName}-deploy-with-invalidation`,
      {
        sources: [s3deploy.Source.asset(sourcePath)],
        destinationBucket: siteBucket,
        distribution,
        distributionPaths: [`/*`],
        // destinationKeyPrefix: basePath,
      },
    )
  }
}
