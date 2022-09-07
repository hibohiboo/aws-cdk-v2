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
import * as iam from 'aws-cdk-lib/aws-iam'
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
        errorOutputPrefix: 'log-archive-failures/!{firehose:error-output-type}/!{timestamp:yyyy}/!{timestamp:MM}/!{timestamp:dd}/!{timestamp:yyyyMMddHHmmss}',
      })],
    });
    core.Tags.of(deliveryStream).add('Name', 'log-to-s3')

    logGroups.forEach(name => {
      const logGroup = logs.LogGroup.fromLogGroupName(this, `log-group-${name}`, name);
      // const filter = logGroup.addSubscriptionFilter(`subscription-filter-${name}`, {
      //   destination: new logsDestinations.KinesisDestination(sourceStream),
      //   filterPattern: logs.FilterPattern.allEvents()
      // })
      new FixedSubscriptionFilter(this, `subscription-filter-${name}`, {
        logGroup,
        destination: new logsDestinations.KinesisDestination(sourceStream),
        filterPattern: logs.FilterPattern.allEvents(),
      });
    })
    core.Tags.of(this).add('Project', 'log-s3')

    // 作成したリソース全てにタグをつける
    Aspects.of(this).add(new Tag('Stack', id));
  }

}

class FixedSubscriptionFilter extends core.Resource {
  constructor(scope: Construct, id: string, props: logs.SubscriptionFilterProps) {
    super(scope, id);

    const destProps = props.destination.bind(this, props.logGroup);

    const filter = new logs.CfnSubscriptionFilter(this, 'Resource', {
      logGroupName: props.logGroup.logGroupName,
      destinationArn: destProps.arn,
      roleArn: destProps.role && destProps.role.roleArn,
      filterPattern: props.filterPattern.logPatternString,
    });

    // Add dependency on policy
    if (destProps.role) {
      // Find policy attached to role
      const policy = destProps.role.node.tryFindChild('DefaultPolicy');
      if (policy) {
        // filter should depend on policy
        filter.node.addDependency(policy);
      } else {
        throw new Error('there is no policy');
      }
    }
  }
}