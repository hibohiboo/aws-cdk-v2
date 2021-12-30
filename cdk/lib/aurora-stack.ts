import { Aspects, RemovalPolicy, SecretValue, Stack, StackProps, Tag, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InstanceClass, InstanceSize, InstanceType, Peer, Port, PrivateSubnet, PrivateSubnetProps, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AuroraPostgresEngineVersion, Credentials, DatabaseCluster, DatabaseClusterEngine, DatabaseProxy, ParameterGroup, ProxyTarget, SubnetGroup } from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

interface AuroraStackProps extends StackProps {
  vpcId: string
  sgId: string
  subnetGroupName: string
  dbSecretName: string
  dbAdminName: string
  dbUserPassword: string
}

export class AuroraStack extends Stack {
  constructor(scope: Construct, id: string, props: AuroraStackProps) {
    // デフォルトのpropsとの意図しない競合を防ぐため、自前で設定したプロパティを削除して親に渡す
    const superProps = {
      ...props, vpcId: undefined, sgId: undefined, subnetName: undefined
      , dbSecretName: undefined, dbAdminName: undefined, dbUserPassword: undefined

    } as StackProps
    super(scope, id, superProps);

    const vpc = Vpc.fromLookup(this, 'Vpc', { vpcId: props.vpcId })
    const securityGroup = SecurityGroup.fromLookupById(this, 'SecurityGroup', props.sgId);
    // subnetGroupNameはlowecaseで作成される
    const subnetGroup = SubnetGroup.fromSubnetGroupName(this, 'SubnetGroup', props.subnetGroupName.toLowerCase());

    const secret = new Secret(this, 'DBCredentioalSecret', {
      secretName: props.dbSecretName,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: props.dbAdminName }),
        excludePunctuation: true, // '、/、"、@、スペースはpostgresのパスワードに利用できないので除外
        includeSpace: false,
        generateStringKey: 'password'
      }
    })
    Tags.of(secret).add('Name', props.dbSecretName);

    // default..aurora-postgresql11が見つからない。。
    // const AURORA_POSTGRES_ENGINE_VERSION = AuroraPostgresEngineVersion.VER_11_9; // LTSのバージョンを選択 2021.12.10
    // const RDS_MAJOR_VERSION = AURORA_POSTGRES_ENGINE_VERSION.auroraPostgresMajorVersion.split('.')[0]
    // const parameterGroup = ParameterGroup.fromParameterGroupName(this, 'DBParameterGroup', `default.aurora-postgresql${RDS_MAJOR_VERSION}`)

    const cluster = new DatabaseCluster(this, 'clusterForAurora', {
      // LTSのバージョンを選択.RDSProxyは10と11のみのサポート 2021.12.10
      engine: DatabaseClusterEngine.auroraPostgres({ version: AuroraPostgresEngineVersion.VER_11_9 }),
      removalPolicy: RemovalPolicy.DESTROY, // 本番運用だと消しちゃだめだと思う
      defaultDatabaseName: 'postgres',
      instanceProps: {
        vpc,
        securityGroups: [securityGroup],
        // postgresを使える最安値 (2021.12.10)
        instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM),
      },
      instances: 1,
      subnetGroup,
      // parameterGroup,
      credentials: Credentials.fromSecret(secret)
    });

    const proxy = new DatabaseProxy(this, 'Proxy', {
      proxyTarget: ProxyTarget.fromCluster(cluster),
      secrets: [secret],
      vpc,
      securityGroups: [securityGroup],
      requireTLS: true,
      iamAuth: true
    });
    Tags.of(proxy).add('Name', 'AuroraProxy');

    const role = new iam.Role(this, 'DBProxyRole', { assumedBy: new iam.AccountPrincipal(this.account) });
    Tags.of(role).add('Name', 'AuroraProxyRole');
    proxy.grantConnect(role, props.dbAdminName); // Grant the role connection access to the DB Proxy for database user 'admin'.

    // 作成したリソース全てにタグをつける
    Aspects.of(this).add(new Tag('Stack', id));

  }
}