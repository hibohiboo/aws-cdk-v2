import { Aspects, Duration, Stack, StackProps, Tag, Tags } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface PythonDockerLambdaS3StackProps extends StackProps {}

export class PythonDockerLambdaS3Stack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: PythonDockerLambdaS3StackProps,
  ) {
    super(scope, id, props);
    const helloImageFunction = new lambda.DockerImageFunction(
      this,
      'AssetFunction',
      {
        functionName: 'docker-lambda-python-hello-world',
        code: lambda.DockerImageCode.fromImageAsset(
          '../python-lambda-project/s3/',
        ),
        timeout: Duration.seconds(30),
        retryAttempts: 0,
        environment: { TEST: 'test' },
        memorySize: 128,
      },
    );
    Tags.of(helloImageFunction).add('Service', 'lambda');

    Aspects.of(this).add(new Tag('Stack', id));
  }
}
