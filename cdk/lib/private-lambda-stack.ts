import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { NODE_LAMBDA_LAYER_DIR } from './process/setup';
import { SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
interface PrivateLambdaStackProps extends StackProps {
  vpcId: string
  sgId: string
  rdsProxyArn: string
  dbAdminName: string
  dbProxyEndpont: string
}

export class PrivateLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: PrivateLambdaStackProps) {
    super(scope, id, props);
    const vpc = Vpc.fromLookup(this, 'Vpc', { vpcId: props.vpcId })
    const securityGroup = SecurityGroup.fromLookupById(this, 'SecurityGroup', props.sgId);
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

    const rdsEnv = {
      DB_PORT: '5432',
      DB_HOST: props.dbProxyEndpont,
      DB_USER: props.dbAdminName,
      DB_DBNAME: 'postgres',
    }
    const rdsAdminResource = `${props.rdsProxyArn}/${props.dbAdminName}`;

    const electricLambda = new NodejsFunction(this, 'electricLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: `../src/handler/api/getElectric.ts`,
      layers: [nodeModulesLayer],
      vpc,
      vpcSubnets,
      securityGroups: [securityGroup],
      bundling,
      environment: { ...rdsEnv },
      initialPolicy: [new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['rds-db:connect'],
        resources: [rdsAdminResource],
      })],
      timeout: Duration.seconds(10),
    });
    const api = new RestApi(this, 'ServerlessRestApi', { cloudWatchRole: false });
    api.root.addResource('hello').addMethod('GET', new LambdaIntegration(helloLambda));
    api.root.addResource('electric').addMethod('GET', new LambdaIntegration(electricLambda));

    // // 認証情報へのアクセス許可
    // const secret = Secret.fromSecretNameV2(this, 'RDSSecret', props.dbSecretName);
    // secret.grantRead(electricLambda);
  }
}
