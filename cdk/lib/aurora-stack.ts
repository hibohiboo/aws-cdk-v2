import { Aspects, RemovalPolicy, Stack, StackProps, Tag, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InstanceClass, InstanceSize, InstanceType, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AuroraPostgresEngineVersion, CfnDBProxyEndpoint, Credentials, DatabaseCluster, DatabaseClusterEngine, DatabaseProxy, DatabaseSecret, ParameterGroup, ProxyTarget, SubnetGroup } from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { AccountPrincipal, Role } from 'aws-cdk-lib/aws-iam';
import { StringListParameter, StringParameter } from 'aws-cdk-lib/aws-ssm';

interface AuroraStackProps extends StackProps {
  vpcId: string
  sgId: string
  subnetGroupName: string
  dbAdminName: string
  dbAdminSecretName: string
  dbReadOnlyUserName: string
  dbReadOnlyUserSecretName: string
  ssmParamKeySubnetIds: string
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

    const secret = this.createSecret({ secretName: props.dbAdminSecretName, rdsName: props.dbAdminName });

    const cluster = new DatabaseCluster(this, 'clusterForAurora', {
      // LTSのバージョンを選択.RDSProxyは10と11のみのサポート 2021.12.10
      engine: DatabaseClusterEngine.auroraPostgres({ version: AuroraPostgresEngineVersion.VER_11_13 }),
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
        engine: DatabaseClusterEngine.auroraPostgres({ version: AuroraPostgresEngineVersion.VER_11_13 }),
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
    const secretForDBUser = this.createSecret({ secretName: props.dbReadOnlyUserSecretName, rdsName: props.dbReadOnlyUserName });

    const proxy = cluster.addProxy('Proxy', {
      secrets: [cluster.secret!, secretForDBUser],
      vpc,
      securityGroups: [securityGroup],
      requireTLS: true,
      iamAuth: true
    });
    Tags.of(proxy).add('Name', 'AuroraRDSProxy');

    const role = new Role(this, 'DBProxyRole', { assumedBy: new AccountPrincipal(this.account) });
    Tags.of(role).add('Name', 'AuroraProxyRole');
    proxy.grantConnect(role, props.dbAdminName);
    proxy.grantConnect(role, props.dbReadOnlyUserName);

    // 読取専用エンドポイント
    const readOnlyEndpoint = new CfnDBProxyEndpoint(this, 'readOnlyProxyEndpoint', {
      dbProxyEndpointName: 'readOnlyProxyEndpoint',
      dbProxyName: proxy.dbProxyName,
      // https://fits.hatenablog.com/entry/2021/09/26/212139
      vpcSubnetIds: StringParameter.valueFromLookup(this, props.ssmParamKeySubnetIds).split(','), // vpc.privateSubnets.map(subnet => subnet.subnetId)やvpc.selectSubnets({ subnetType: SubnetType.PRIVATE_ISOLATED }).subnetIds では0個になってしまう。 VpcSubnetIds: expected minimum item count: 2, found: 0
      targetRole: 'READ_ONLY',
      vpcSecurityGroupIds: [props.sgId]
    })
    Tags.of(readOnlyEndpoint).add('Name', 'readOnlyProxyEndpoint');

    // 作成したリソース全てにタグをつける
    Aspects.of(this).add(new Tag('Stack', id));
  }

  private createSecret(props: { secretName: string, rdsName: string }) {
    const secret = new DatabaseSecret(this, props.secretName, {
      secretName: props.secretName,
      username: props.rdsName
    });
    Tags.of(secret).add('Name', props.secretName);
    return secret;
  }
}
