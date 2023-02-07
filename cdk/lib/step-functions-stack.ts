import * as cdk from 'aws-cdk-lib';
import * as stepfunc from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { aws_events, aws_events_targets } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface StepFunctionSampleStackProps extends cdk.StackProps {
  vpcId: string
  sgId: string
  rdsProxyResourceId: string
  dbAdminName: string
  dbProxyEndpoint: string
  dbReadOnlyUserName: string
  dbProxyReadOnlyEndpoint: string
}
export class StepFunctionSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StepFunctionSampleStackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, 'Vpc', { vpcId: props.vpcId })
    const securityGroup = SecurityGroup.fromLookupById(this, 'SecurityGroup', props.sgId);
    const vpcSubnets = vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_ISOLATED })
    const lambdaParamsDefault = {
      vpc,
      vpcSubnets,
      securityGroups: [securityGroup],
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      // layers: [nodeModulesLayer],
      // bundling
    }

    // Lambda samples
    const firstFunction = new lambda.Function(this, 'FirstFunction', {
      ...lambdaParamsDefault,
      code: lambda.Code.fromInline(`
        exports.handler = (event, context, callback) => {
          console.log(event);
          callback(null, {"Payload": {"Message": "hello", firstEvent: event}});
        };
      `),
    });
    const secondFunction = new lambda.Function(this, 'SecondFunction', {
      ...lambdaParamsDefault,
      code: lambda.Code.fromInline(`
      exports.handler = (event, context, callback) => {
        console.log(event);
        callback(null, {});
      };
      `),
    });

    // definite state machine
    const upstreamJob = new tasks.LambdaInvoke(this, 'UpstreamTask', {
      lambdaFunction: firstFunction,
      outputPath: '$.Payload',
    });
    const mainJob = new tasks.LambdaInvoke(this, 'MainFunctionTask', {
      lambdaFunction: secondFunction,
      payload: stepfunc.TaskInput.fromJsonPathAt('$.Payload'),
    });


    // StateMachine
    const definition = upstreamJob.next(mainJob).next(new stepfunc.Succeed(this, 'Queued'));
    const stateMachine = new stepfunc.StateMachine(this, 'StepFunctionSampleStateMachine', {
      definition,
    });

    // EventBridge Rule1（毎時15〜30分に起動）
    new aws_events.Rule(this, 'rule1', {
      ruleName: 'sampleRule1',
      schedule: aws_events.Schedule.cron({
        minute: '40-50',
      }),
      targets: [new aws_events_targets.SfnStateMachine(stateMachine)],
    });
  }
}