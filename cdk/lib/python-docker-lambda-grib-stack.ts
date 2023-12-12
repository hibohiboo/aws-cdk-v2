import {
  Aspects,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
  Tag,
  Tags,
} from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
} from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

interface PythonDockerLambdaS3StackProps extends StackProps {
  projectDirectory: string;
}

export class PythonDockerLambdaGribStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: PythonDockerLambdaS3StackProps,
  ) {
    super(scope, id, props);
    const bucket = new Bucket(this, 'Bucket', {
      bucketName: 'hibohiboo-python-lambda-project-grib',
      publicReadAccess: false,
      accessControl: BucketAccessControl.PRIVATE,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    new BucketDeployment(this, 'DeployFiles', {
      destinationBucket: bucket,
      sources: [Source.asset(`${props.projectDirectory}/s3Data/`)],
    });

    const helloImageFunction = new lambda.DockerImageFunction(
      this,
      'AssetFunction',
      {
        functionName: 'docker-lambda-python-hello-world',
        code: lambda.DockerImageCode.fromImageAsset(
          `${props.projectDirectory}/grib/`,
        ),
        timeout: Duration.seconds(30),
        retryAttempts: 0,
        environment: { S3_BUCKET_NAME: bucket.bucketName },
        memorySize: 128,
      },
    );
    bucket.grantReadWrite(helloImageFunction);
    Tags.of(helloImageFunction).add('Service', 'lambda');

    Aspects.of(this).add(new Tag('Stack', id));
  }
}
