import { Aspects, CfnOutput, Duration, RemovalPolicy, Stack, StackProps, Tag } from "aws-cdk-lib";
import { Alarm, AlarmProps, AlarmRule, AlarmState, ComparisonOperator, CompositeAlarm, Metric, MetricProps, TreatMissingData } from "aws-cdk-lib/aws-cloudwatch";
import { Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
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
    const mailSenderLambda = new NodejsFunction(this, 'publishLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: `../src/handler/eventBridge/sendMail.ts`,
      environment: { snsTopic: topicName },
    })
    snsTopic.grantPublish(mailSenderLambda)
    new CfnOutput(this, `sns-confirm-subscription`, {
      value: `aws sns confirm-subscription --topic-arn ${snsTopic.topicArn} --authenticate-on-unsubscribe true --region ${props.env?.region} --profile produser --token xxxCopyAndPasteTokenfromMailxxx`,
    })
    new CfnOutput(this, `sns-list`, {
      value: `aws sns list-subscriptions-by-topic --topic-arn ${snsTopic.topicArn} --profile produser`,
    })

    const alarmProp: Omit<AlarmProps, 'metric'> = {
      threshold: 5, // データポイントのメトリックのvalueのしきい値
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      datapointsToAlarm: 2, // x分以内のyデータポイント: y
      evaluationPeriods: 3, // x分以内のyデータポイント: x
      treatMissingData: TreatMissingData.NOT_BREACHING,
      actionsEnabled: false,
    } as const;
    const metricProps: MetricProps = {
      namespace: 'Test',
      metricName: 'TestCount',
      period: Duration.minutes(1),
      statistic: 'Sum'
    } as const;
    const alarmRules = ['test1', 'test2'].map(alarmName => {
      const metric = new Metric({ ...metricProps, dimensionsMap: { Target: alarmName } });
      const alarm = new Alarm(this, alarmName, { ...alarmProp, alarmName, metric });
      alarm.applyRemovalPolicy(RemovalPolicy.DESTROY);
      return AlarmRule.fromAlarm(alarm, AlarmState.ALARM)
    });
    const compositeAlarmName = 'composite-alarm';

    const compositeAlarm = new CompositeAlarm(this, compositeAlarmName, { compositeAlarmName, alarmRule: AlarmRule.anyOf(...alarmRules) });
    const rule = new Rule(this, 'composit-rule', { eventPattern: { resources: [compositeAlarm.alarmArn], detail: { state: { value: ['ALARM', 'OK'] } } } });
    rule.addTarget(new LambdaFunction(mailSenderLambda))
    compositeAlarm.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const describeLambda = new NodejsFunction(this, 'describeLambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: `../src/handler/invoke/describeAlarm.ts`,
      environment: { compositeAlarmName },
      initialPolicy: [new PolicyStatement({ actions: ['cloudwatch:DescribeAlarms'], resources: ['*'] })]
    });

    Aspects.of(this).add(new Tag('Stack', 'AlarmSNSStack'));
  }
}
