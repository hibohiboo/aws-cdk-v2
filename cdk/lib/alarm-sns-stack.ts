import { Aspects, CfnOutput, Stack, StackProps, Tag } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";
interface AlarmSNSStackProps extends StackProps { emailAdress: string }
export class AlarmSNSStack extends Stack {
  constructor(scope: Construct, id: string, props: AlarmSNSStackProps) {
    super(scope, id, props);
    const topicName = 'topic'
    const snsTopic = new Topic(this, topicName, { displayName: topicName, topicName, fifo: false });
    snsTopic.addSubscription(new EmailSubscription(props.emailAdress));

    snsTopic.grantPublish(new NodejsFunction(this, 'publishLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: `../src/handler/invoke/events/sendMail.ts`,
      environment: { snsTopic: topicName },
    }))
    new CfnOutput(this, `sns-confirm-subscription`, {
      value: `aws sns confirm-subscription --topic-arn ${snsTopic.topicArn} --authenticate-on-unsubscribe true --region ${props.env?.region} --profile produser --token xxxCopyAndPasteTokenfromMailxxx`,
    })
    new CfnOutput(this, `sns-list`, {
      value: `aws sns list-subscriptions-by-topic --topic-arn ${snsTopic.topicArn} --profile produser`,
    })
    Aspects.of(this).add(new Tag('Stack', 'AlarmSNSStack'));
  }
}
