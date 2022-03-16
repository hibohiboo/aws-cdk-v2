import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

export class MockApiGWStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps
  ) {
    super(scope, id, props);

    const api = new apigw.RestApi(this, 'Api', {});
    const mockIntegration = new apigw.MockIntegration({
      requestTemplates: {
        'application/json': '{"statusCode": 200}'
      },
      integrationResponses: [
        {
          statusCode: '200',
          responseTemplates: {
            'application/json': '{ "message": "mock", "now": "$context.authorizer.now" }'
          }
        }
      ]
    });
    const method = api.root.addResource('pets').addMethod('GET', mockIntegration, {
      methodResponses: [
        {
          statusCode: '200'
        }
      ]
    });

    new CfnOutput(this, 'OutputApiUrl', { value: api.url! });
  }
}