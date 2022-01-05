import { Stack, StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { NODE_LAMBDA_LAYER_DIR } from './process/setup';
import { SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { SubnetGroup } from 'aws-cdk-lib/aws-rds';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';

interface PrivateLambdaStackProps extends StackProps {
  vpcId: string
  sgId: string
  subnetGroupName: string
  dbSecretName: string
}


export class PrivateLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: PrivateLambdaStackProps) {
    super(scope, id, props);
    const vpc = Vpc.fromLookup(this, 'Vpc', { vpcId: props.vpcId })
    const securityGroup = SecurityGroup.fromLookupById(this, 'SecurityGroup', props.sgId);
    // subnetGroupNameはlowecaseで作成される
    const vpcSubnets = vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_ISOLATED })

    const nodeModulesLayer = new lambda.LayerVersion(this, 'NodeModulesLayer',
      {
        code: lambda.AssetCode.fromAsset(NODE_LAMBDA_LAYER_DIR),
        compatibleRuntimes: [lambda.Runtime.NODEJS_14_X]
      }
    );
    const bundling = {
      externalModules: [
        'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        'date-fns', // Layrerに入れておきたいモジュール
        'pg'
      ],
    }

    const helloLambda = new NodejsFunction(this, 'helloLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: `../src/handler/api/hello.ts`,
      layers: [nodeModulesLayer],
      vpc,
      vpcSubnets,
      securityGroups: [securityGroup],
      bundling
    });

    const electricLambda = new NodejsFunction(this, 'electricLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: `../src/handler/api/getElectric.ts`,
      layers: [nodeModulesLayer],
      vpc,
      vpcSubnets,
      securityGroups: [securityGroup],
      bundling,
      environment: {
        END_POINT: 'proxy.proxy-sample.ap-northeast-1.rds.amazonaws.com',
        RDS_SECRET_NAME: 'dbSecretName'
      }
    });
    const api = new RestApi(this, 'ServerlessRestApi', { cloudWatchRole: false });
    api.root.addResource('hello').addMethod('GET', new LambdaIntegration(helloLambda));
    api.root.addResource('electric').addMethod('GET', new LambdaIntegration(electricLambda));
  }
}
