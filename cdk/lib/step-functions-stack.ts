import * as cdk from 'aws-cdk-lib';
import * as stepfunc from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { aws_events, aws_events_targets } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Choice, Condition, DefinitionBody, Pass, Result } from 'aws-cdk-lib/aws-stepfunctions';

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
        return event.firstEvent;
      };
      `),
    });
    const iteratorFunction = new lambda.Function(this, 'iteratorFunction', {
      ...lambdaParamsDefault,
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  let index = event.iterator.index
  const step = event.iterator.step
  const count = event.iterator.count
 
  index = index + step
  const iterator = { index, step, count, continue: index < count }

  const dt = new Date(event.time);
  dt.setDate(dt.getDate() + 1);

  return { iterator, time: dt.toISOString() };
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
      outputPath: '$.Payload',
    });

    const configureCount = new Pass(this, 'ConfigureCount', {
      result: Result.fromObject({ count: 3, index: 0, step: 1 }),
      resultPath: '$.iterator',
    });
    const iteratorJob = new tasks.LambdaInvoke(this, 'Iterator', {
      lambdaFunction: iteratorFunction,
      payloadResponseOnly: true,
      retryOnServiceExceptions: false
    });
    const exampleWork = new Pass(this, 'ExampleWork', {
      comment: "Your application logic, to run a specific number of times",
      result: Result.fromObject({ success: true }),
      resultPath: '$.result',
    });
    const isCountReached = new Choice(this, 'IsCountReached');
    const condition1 = Condition.booleanEquals('$.iterator.continue', true);
    // StateMachine
    const iterators = configureCount.next(iteratorJob).next(
      isCountReached.when(condition1, exampleWork.next(iteratorJob)).otherwise(new Pass(this, 'Done'))
    );
    const definition = firstJonb.next(secondJob).next(iterators);
    const stateMachine = new stepfunc.StateMachine(this, 'StepFunctionSampleStateMachine', {
      comment: "Iterator State Machine Example",
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
