import { Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class PythonDockerLambdaEchoStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const dockerImage = lambda.DockerImageCode.fromImageAsset(
      '../python-lambda-project/echo',
      {
        cmd: ['app.handler'],
      },
    );

    new DockerImageFunction(this, 'LambdaFunction', {
      code: dockerImage,
      // memorySize: 512,
      // timeout: cdk.Duration.seconds(30),
    });
  }
}
