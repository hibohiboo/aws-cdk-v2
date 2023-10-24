import { Duration, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import {
  AnyPrincipal,
  Effect,
  PolicyDocument,
  PolicyStatement,
} from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
  EventType,
} from 'aws-cdk-lib/aws-s3';
import * as s3Notify from 'aws-cdk-lib/aws-s3-notifications';
import { Topic, TopicPolicy } from 'aws-cdk-lib/aws-sns';
import { LambdaSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
interface S3FilterStackProps extends StackProps {
  projectNameTag: string;
  bucketName: string;
  topicName: string;
}
export class S3FilterStack extends Stack {
  constructor(scope: Construct, id: string, props: S3FilterStackProps) {
    super(scope, id, props);
    const bucket = this.createBucket(props);
    const sns = this.createSNS(props, bucket);
    this.createLambda(sns);
    Tags.of(this).add('Project', props.projectNameTag);
  }

  private createBucket(props: { bucketName: string }) {
    const bucket = new Bucket(this, props.bucketName, {
      bucketName: props.bucketName,
      accessControl: BucketAccessControl.PRIVATE,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [{ expiration: Duration.days(90) }],
    });
    return bucket;
  }
  private createSNS(props: { topicName: string }, bucket: Bucket) {
    const sns = new Topic(this, props.topicName, {
      displayName: props.topicName,
      topicName: props.topicName,
      fifo: false,
    });
    new TopicPolicy(this, `${props.topicName}-policy`, {
      topics: [sns],
      policyDocument: new PolicyDocument({
        statements: [
          new PolicyStatement({
            actions: [
              'SNS:GetTopicAttributes',
              'SNS:SetTopicAttributes',
              'SNS:AddPermission',
              'SNS:RemovePermission',
              'SNS:DeleteTopic',
              'SNS:Subscribe',
              'SNS:ListSubscriptionsByTopic',
              'SNS:Publish',
              'SNS:Receive',
            ],
            effect: Effect.ALLOW,
            resources: [sns.topicArn],
            principals: [new AnyPrincipal()],
          }),
        ],
      }),
    });
    bucket.addEventNotification(
      EventType.OBJECT_CREATED_COPY,
      new s3Notify.SnsDestination(sns),
      { prefix: 'ptest/' },
    );
    return sns;
  }
  private createLambda(sns: Topic) {
    const lambda = new NodejsFunction(this, 'describeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: `../src/handler/invoke/describeSNS.ts`,
      functionName: 's3-filter-sns-subscription',
    });
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_sns_subscriptions.LambdaSubscription.html
    sns.addSubscription(new LambdaSubscription(lambda));
    return lambda;
  }
}
