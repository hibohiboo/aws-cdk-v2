import { Aspects, Duration, Stack, StackProps, Tag } from 'aws-cdk-lib';

import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class PlayWrightStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    new NodejsFunction(this, 'playWrightLambda', {
      runtime: Runtime.NODEJS_18_X,
      memorySize: 1024,
      timeout: Duration.seconds(10),
      entry: `../src/handler/invoke/playwright.ts`,
      bundling: { externalModules: ['@sparticuz/chromium'] },
      layers: [
        LayerVersion.fromLayerVersionArn(
          this,
          'chromium-lambda-layer',
          'arn:aws:lambda:ap-northeast-1:764866452798:layer:chrome-aws-lambda:39',
        ),
      ],
    });

    Aspects.of(this).add(new Tag('Stack', 'PlayWrightStack'));
  }
}
