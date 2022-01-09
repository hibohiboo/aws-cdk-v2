import { Aspects, RemovalPolicy, Stack, StackProps, Tag, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InstanceClass, InstanceSize, InstanceType, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AuroraPostgresEngineVersion, Credentials, DatabaseCluster, DatabaseClusterEngine, DatabaseSecret, ParameterGroup, SubnetGroup } from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { AccountPrincipal, Role } from 'aws-cdk-lib/aws-iam';

interface AuroraStackProps extends StackProps {
  vpcId: string
  sgId: string
  subnetGroupName: string
  dbAdminName: string
  dbAdminSecretName: string
  dbReadOnlyUserName: string
  dbReadOnlyUserSecretName: string
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

    // subnetGroupNameはlowecaseで作成されている
    const subnetGroup = SubnetGroup.fromSubnetGroupName(this, 'SubnetGroup', props.subnetGroupName.toLowerCase());

    const secret = new DatabaseSecret(this, props.dbAdminSecretName, {
      secretName: props.dbAdminSecretName,
      username: props.dbAdminName
    });
    Tags.of(secret).add('Name', props.dbAdminSecretName);

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
      instances: 2,
      subnetGroup,
      // https://dev.classmethod.jp/articles/cdk-practice-21-rds-parameter-group/
      parameterGroup: new ParameterGroup(this, 'rds params', {
        engine: DatabaseClusterEngine.auroraPostgres({ version: AuroraPostgresEngineVersion.VER_11_9 }),
        description: 'Cluster Parameter Group for RDS',
        parameters: {
          log_rotation_age: '30' // デフォルト60分。
        },
      }),
      credentials: Credentials.fromSecret(secret)
    });

    // https://docs.aws.amazon.com/cdk/api/v2//docs/aws-cdk-lib.aws_rds-readme.html
    // パスワードのローテーション設定。 ローテーション感覚はデフォルトは30日。パスワードに使用しない文字はデフォルトで、" %+~`#$&*()|[]{}:;<>?!'/@\"\\"
    // cluster.addRotationSingleUser();

    // RDSでの作成ユーザをシークレットに登録
    const secretForDBUser = new DatabaseSecret(this, props.dbReadOnlyUserSecretName, {
      secretName: props.dbReadOnlyUserSecretName,
      username: props.dbReadOnlyUserName
    });
    Tags.of(secret).add('Name', props.dbAdminSecretName);

    const proxy = cluster.addProxy('Proxy', {
      secrets: [cluster.secret!, secretForDBUser],
      vpc,
      securityGroups: [securityGroup],
      requireTLS: true,
      iamAuth: true
    });
    Tags.of(proxy).add('Name', 'AuroraProxy');

    const role = new Role(this, 'DBProxyRole', { assumedBy: new AccountPrincipal(this.account) });
    Tags.of(role).add('Name', 'AuroraProxyRole');
    proxy.grantConnect(role, props.dbAdminName);
    proxy.grantConnect(role, props.dbReadOnlyUserName);

    // 作成したリソース全てにタグをつける
    Aspects.of(this).add(new Tag('Stack', id));
  }
}
