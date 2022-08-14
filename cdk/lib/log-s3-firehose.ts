import * as core from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import * as firehose from "@aws-cdk/aws-kinesisfirehose-alpha";
import * as kinesisDestinations from '@aws-cdk/aws-kinesisfirehose-destinations-alpha';
import * as logsDestinations from 'aws-cdk-lib/aws-logs-destinations';
import * as kinesis from 'aws-cdk-lib/aws-kinesis'
import { aws_logs as logs } from 'aws-cdk-lib';
import { Aspects, Tag } from 'aws-cdk-lib'
import logGroups from '../constants/log-groups.json';

interface Props extends core.StackProps {
  bucketName: string
}

export class LogS3FireHoseStack extends core.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props)
    const bucket = new s3.Bucket(this, props.bucketName, {
      bucketName: props.bucketName,
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: core.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [{
        expiration: core.Duration.days(90)
      }]

    })
    const sourceStream = new kinesis.Stream(this, 'Source Stream');
    const deliveryStream = new firehose.DeliveryStream(this, 'Delivery Stream', {
      sourceStream,
      destinations: [new kinesisDestinations.S3Bucket(bucket, {
        dataOutputPrefix: 'log-archive/!{timestamp:yyyy}/!{timestamp:MM}/!{timestamp:dd}/!{timestamp:HHmmss}/!{firehose:random-string}',
        errorOutputPrefix: 'log-archive-failures/!{firehose:error-output-type}/!{timestamp:yyyy}/anyMonth/!{timestamp:dd}',
      })],
    });
    core.Tags.of(deliveryStream).add('Name', 'log-to-s3')

    logGroups.forEach(name => {
      const logGroup = logs.LogGroup.fromLogGroupName(this, `log-group-${name}`, name);
      logGroup.addSubscriptionFilter(`subscription-filter-${name}`, {
        destination: new logsDestinations.KinesisDestination(sourceStream),
        filterPattern: logs.FilterPattern.allEvents()
      })
    })
    core.Tags.of(this).add('Project', 'log-s3')

    // 作成したリソース全てにタグをつける
    Aspects.of(this).add(new Tag('Stack', id));
  }

}
