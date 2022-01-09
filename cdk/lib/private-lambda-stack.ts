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
  dbReadOnlyUserName: string
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
    const rdsEnvReadOnly = {
      ...rdsEnv,
      DB_USER: props.dbReadOnlyUserName,
    }
    const rdsAdminResource = `${props.rdsProxyArn}/${props.dbAdminName}`;
    const rdsReadOnlyUserResource = `${props.rdsProxyArn}/${props.dbReadOnlyUserName}`;

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
    const electricResource = api.root.addResource('electric')
    electricResource.addMethod('GET', new LambdaIntegration(electricLambda));


    const electricLambda2 = new NodejsFunction(this, 'electricLambda2', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: `../src/handler/api/getElectric.ts`,
      layers: [nodeModulesLayer],
      vpc,
      vpcSubnets,
      securityGroups: [securityGroup],
      bundling,
      environment: { ...rdsEnvReadOnly },
      initialPolicy: [new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['rds-db:connect'],
        resources: [rdsReadOnlyUserResource],
      })],
      timeout: Duration.seconds(10),
    });
    const electricReadonlyResource = api.root.addResource('electric-readonly');
    electricReadonlyResource.addMethod('GET', new LambdaIntegration(electricLambda2));

    const electricLambda3 = new NodejsFunction(this, 'electricLambda3', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: `../src/handler/api/postElectric.ts`,
      layers: [nodeModulesLayer],
      vpc,
      vpcSubnets,
      securityGroups: [securityGroup],
      bundling,
      environment: { ...rdsEnvReadOnly },
      initialPolicy: [new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['rds-db:connect'],
        resources: [rdsReadOnlyUserResource],
      })],
      timeout: Duration.seconds(10),
    });
    electricReadonlyResource.addMethod('POST', new LambdaIntegration(electricLambda3));

    const electricLambda4 = new NodejsFunction(this, 'electricLambda4', {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: `../src/handler/api/postElectric.ts`,
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
      timeout: Duration.seconds(10), // DBへの再接続を1秒置き、3回まで行うため、デフォルトの3秒より延ばしておく
    });
    electricResource.addMethod('POST', new LambdaIntegration(electricLambda4));
    // // 認証情報へのアクセス許可
    // const secret = Secret.fromSecretNameV2(this, 'RDSSecret', props.dbSecretName);
    // secret.grantRead(electricLambda);
  }
}
