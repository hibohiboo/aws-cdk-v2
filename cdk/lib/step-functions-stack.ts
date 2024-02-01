import * as cdk from 'aws-cdk-lib';
import * as stepfunc from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { aws_events, aws_events_targets } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DefinitionBody } from 'aws-cdk-lib/aws-stepfunctions';

interface StepFunctionSampleStackProps extends cdk.StackProps { }
export class StepFunctionSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StepFunctionSampleStackProps) {
    super(scope, id, props);
    const lambdaParamsDefault = {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      // layers: [nodeModulesLayer],
      // bundling
    }

    // Lambda samples
    const firstFunction = new lambda.Function(this, 'FirstFunction', {
      ...lambdaParamsDefault,
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log(event);
          const Payload = { message: "hello", firstEvent: event }
          return { Payload }
        };
      `),
    });
    const secondFunction = new lambda.Function(this, 'SecondFunction', {
      ...lambdaParamsDefault,
      code: lambda.Code.fromInline(`
      exports.handler = async (event) => {
        console.log(event);
        return event;
      };
      `),
    });

    // definite state machine
    const firstJonb = new tasks.LambdaInvoke(this, 'UpstreamTask', {
      lambdaFunction: firstFunction,
      outputPath: '$.Payload',
    });
    const secondJob = new tasks.LambdaInvoke(this, 'MainFunctionTask', {
      lambdaFunction: secondFunction,
      payload: stepfunc.TaskInput.fromJsonPathAt('$.Payload'),
    });


    // StateMachine
    const definition = firstJonb.next(secondJob).next(new stepfunc.Succeed(this, 'Queued'));
    const stateMachine = new stepfunc.StateMachine(this, 'StepFunctionSampleStateMachine', {
      definitionBody: DefinitionBody.fromChainable(definition),
    });

    // EventBridge Rule1（毎時5分に起動）
    new aws_events.Rule(this, 'rule1', {
      ruleName: 'sampleRule1',
      schedule: aws_events.Schedule.cron({
        minute: '5',
      }),
      targets: [new aws_events_targets.SfnStateMachine(stateMachine)],
    });
  }
}
