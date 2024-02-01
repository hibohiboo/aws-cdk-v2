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


    const iteratorFunction = new lambda.Function(this, 'iteratorFunction', {
      ...lambdaParamsDefault,
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  let index = event.iterator.index
  const step = event.iterator.step
  const count = event.iterator.count
 
  index = index + step
  return { index, step, count, continue: index < count };
};
      `),
    });

    const configureCount = new Pass(this, 'ConfigureCount', {
      result: Result.fromObject({ count: 10, index: 0, step: 1 }),
      resultPath: '$.iterator',
    });
    const iteratorJob = new tasks.LambdaInvoke(this, 'Iterator', {
      lambdaFunction: iteratorFunction,
      resultPath: '$.iterator',
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
    const definition = configureCount.next(iteratorJob).next(
      isCountReached.when(condition1, exampleWork.next(iteratorJob)).otherwise(new Pass(this, 'Done'))
    );
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
