import { Stack, StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const helloLambda = new NodejsFunction(this, 'test', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: `../src/handler/api/hello.ts`,
    });
    const api = new RestApi(this, 'ServerlessRestApi', { cloudWatchRole: false });
    api.root.addResource('hello').addMethod('GET', new LambdaIntegration(helloLambda));
  }
}
