import { Aspects, Stack, StackProps, Tag, Tags } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { NODE_UTIL_LAMBDA_LAYER_DIR, NODE_VERIFY_LAMBDA_LAYER_DIR } from './process/preForCognitoLambda';

interface LambdaLayersForCognitoStackProps extends StackProps {
  utilSSMKey: string
  verifySSMKey: string
}

export class LambdaLayersForCognitoStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaLayersForCognitoStackProps) {
    super(scope, id, props);
    const utilNodeModulesLayer = new lambda.LayerVersion(this, 'utilNodeModulesLayer',
      {
        code: lambda.AssetCode.fromAsset(NODE_UTIL_LAMBDA_LAYER_DIR),
        compatibleRuntimes: [lambda.Runtime.NODEJS_14_X]
      }
    );

    // Lambda Layer参照用にarnを保存
    const utilLayerArnParameter = new StringParameter(this, "ssm-util-layer-version", {
      parameterName: props.utilSSMKey,
      stringValue: utilNodeModulesLayer.layerVersionArn,
      description: 'layer version arn for lambda util'
    });
    Tags.of(utilLayerArnParameter).add('Name', 'ssm-layer-version-util');

    const verifyNodeModulesLayer = new lambda.LayerVersion(this, 'verifyNodeModulesLayer',
      {
        code: lambda.AssetCode.fromAsset(NODE_VERIFY_LAMBDA_LAYER_DIR),
        compatibleRuntimes: [lambda.Runtime.NODEJS_14_X]
      }
    );

    // verify
    const verifyLayerArnParameter = new StringParameter(this, "ssm-vefify-layer-version", {
      parameterName: props.verifySSMKey,
      stringValue: verifyNodeModulesLayer.layerVersionArn,
      description: 'layer version arn for lambda verify'
    });
    Tags.of(verifyLayerArnParameter).add('Name', 'ssm-layer-version-verify');
    Aspects.of(this).add(new Tag('Stack', id));
  }
}
