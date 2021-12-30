import { Stack, StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { COMMON_LAMBDA_LAYER_DIR, NODE_LAMBDA_LAYER_DIR } from './process/setup';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { SubnetGroup } from 'aws-cdk-lib/aws-rds';

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
    const vpcSubnets = SubnetGroup.fromSubnetGroupName(this, 'SubnetGroup', props.subnetGroupName.toLowerCase());

    const nodeModulesLayer = new lambda.LayerVersion(this, 'NodeModulesLayer',
      {
        code: lambda.AssetCode.fromAsset(NODE_LAMBDA_LAYER_DIR),
        compatibleRuntimes: [lambda.Runtime.NODEJS_14_X]
      }
    );

    const helloLambda = new NodejsFunction(this, 'helloLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: `../src/handler/api/hello.ts`,
      layers: [nodeModulesLayer],
      vpc,
      vpcSubnets,
      securityGroups: [securityGroup],
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
          'date-fns', // Layrerに入れておきたいモジュール

        ],

      },
      environment: {
        END_POINT: 'proxy.proxy-chi1oriyu1of.ap-northeast-1.rds.amazonaws.com',
        RDS_SECRET_NAME: 'dbSecretName'
      }
    });

  }
}
