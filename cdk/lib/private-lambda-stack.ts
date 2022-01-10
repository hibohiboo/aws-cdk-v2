import { Aspects, Duration, Stack, StackProps, Tag, Tags } from 'aws-cdk-lib';
import { NodejsFunction, BundlingOptions } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { NODE_LAMBDA_LAYER_DIR } from './process/setup';
import { ISecurityGroup, IVpc, SecurityGroup, SelectedSubnets, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

interface PrivateLambdaStackProps extends StackProps {
  vpcId: string
  sgId: string
  rdsProxyResourceId: string
  dbAdminName: string
  dbProxyEndpoint: string
  dbReadOnlyUserName: string
  dbProxyReadOnlyEndpoint: string
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
    const lambdaParamsDefault = {
      layers: [nodeModulesLayer],
      vpc,
      vpcSubnets,
      securityGroups: [securityGroup],
      bundling
    }

    const helloLambda = this.createLambda({
      ...lambdaParamsDefault,
      entry: `../src/handler/api/hello.ts`,
      name: 'hellorLambda',
      descritption: 'サンプル用メッセージ表示'
    })

    const rdsEnv = {
      DB_PORT: '5432',
      DB_HOST: props.dbProxyEndpoint,
      DB_USER: props.dbAdminName,
      DB_DBNAME: 'postgres',
    }
    const rdsEnvReadOnly = {
      ...rdsEnv,
      DB_HOST: props.dbProxyReadOnlyEndpoint,
      DB_USER: props.dbReadOnlyUserName,
      IS_READ_ONLY: 'true'
    }
    const dbConnectArn = `arn:aws:rds-db:${this.region}:${this.account}:dbuser:${props.rdsProxyResourceId}`
    const rdsAdminResource = `${dbConnectArn}/${props.dbAdminName}`;
    const rdsReadOnlyUserResource = `${dbConnectArn}/${props.dbReadOnlyUserName}`;
    const adminPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['rds-db:connect'],
      resources: [rdsAdminResource],
    })
    const readOnlyUserPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['rds-db:connect'],
      resources: [rdsReadOnlyUserResource],
    })


    const electricLambda = this.createLambda({
      ...lambdaParamsDefault,
      entry: `../src/handler/api/getElectric.ts`,
      name: 'electricLambda',
      descritption: 'RDSAdminでテーブル参照',
      environment: { ...rdsEnv },
      initialPolicy: [adminPolicy],
      timeoutSec: 10, // DBへの再接続を1秒置き、3回まで行うため、デフォルトの3秒より延ばしておく
    })

    const api = new RestApi(this, 'ServerlessRestApi', { cloudWatchRole: false });
    api.root.addResource('hello').addMethod('GET', new LambdaIntegration(helloLambda));
    const electricResource = api.root.addResource('electric')
    electricResource.addMethod('GET', new LambdaIntegration(electricLambda));

    const electricLambda2 = this.createLambda({
      ...lambdaParamsDefault,
      entry: `../src/handler/api/getElectric.ts`,
      name: 'electricLambda2',
      descritption: 'RDS 読取専用ユーザでテーブル参照',
      environment: { ...rdsEnvReadOnly },
      initialPolicy: [readOnlyUserPolicy],
      timeoutSec: 10,
    })

    const electricReadonlyResource = api.root.addResource('electric-readonly');
    electricReadonlyResource.addMethod('GET', new LambdaIntegration(electricLambda2));

    const electricLambda3 = this.createLambda({
      ...lambdaParamsDefault,
      entry: `../src/handler/api/postElectric.ts`,
      name: 'electricLambda3',
      descritption: 'RDS 読取専用ユーザでテーブル挿入',
      environment: { ...rdsEnvReadOnly },
      initialPolicy: [readOnlyUserPolicy],
      timeoutSec: 10,
    })

    electricReadonlyResource.addMethod('POST', new LambdaIntegration(electricLambda3));

    const electricLambda4 = this.createLambda({
      ...lambdaParamsDefault,
      entry: `../src/handler/api/postElectric.ts`,
      name: 'electricLambda4',
      descritption: 'RDSAdminでテーブル挿入',
      environment: { ...rdsEnv },
      initialPolicy: [adminPolicy],
      timeoutSec: 10,
    })
    electricResource.addMethod('POST', new LambdaIntegration(electricLambda4));

    // // 認証情報へのアクセス許可
    // const secret = Secret.fromSecretNameV2(this, 'RDSSecret', props.dbSecretName);
    // secret.grantRead(electricLambda);

    Aspects.of(this).add(new Tag('Stack', id));
  }

  private createLambda(props: {
    layers: lambda.LayerVersion[]
    vpc: IVpc
    vpcSubnets: SelectedSubnets
    securityGroups: ISecurityGroup[]
    bundling: BundlingOptions
    name: string
    descritption: string
    entry: string
    environment?: Record<string, string>
    initialPolicy?: PolicyStatement[]
    timeoutSec?: number
  }) {
    const func = new NodejsFunction(this, props.name, {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: props.entry,
      functionName: props.name,
      description: props.descritption,
      layers: props.layers,
      vpc: props.vpc,
      vpcSubnets: props.vpcSubnets,
      securityGroups: props.securityGroups,
      bundling: props.bundling,
      environment: props.environment,
      initialPolicy: props.initialPolicy,
      timeout: props.timeoutSec ? Duration.seconds(props.timeoutSec) : undefined,
    });
    Tags.of(func).add('Name', props.name);
    return func;
  }
}
