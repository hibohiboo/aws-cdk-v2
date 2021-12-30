import { Aspects, RemovalPolicy, SecretValue, Stack, StackProps, Tag, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BastionHostLinux, InstanceClass, InstanceSize, InstanceType, Peer, Port, PrivateSubnet, PrivateSubnetProps, PublicSubnet, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

interface BastionStackProps extends StackProps {
  vpcId: string
  sgId: string
  dbSecretName: string
  publicSubnetId: string
}

export class BastionStack extends Stack {
  constructor(scope: Construct, id: string, props: BastionStackProps) {
    // デフォルトのpropsとの意図しない競合を防ぐため、自前で設定したプロパティを削除して親に渡す
    const superProps = {
      ...props, vpcId: undefined, sgId: undefined, subnetName: undefined
      , dbSecretName: undefined, dbAdminName: undefined, dbUserPassword: undefined

    } as StackProps
    super(scope, id, superProps);

    const vpc = Vpc.fromLookup(this, 'Vpc', { vpcId: props.vpcId })
    const bastionGroup = SecurityGroup.fromLookupById(this, 'SecurityGroup', props.sgId);

    // パブリックサブネットに踏み台サーバを配置する
    const subnet = PublicSubnet.fromPublicSubnetAttributes(this, 'PublicSubnet', {
      subnetId: props.publicSubnetId,
      availabilityZone: 'ap-northeast-1a'
    });
    const host = new BastionHostLinux(this, 'BastionHost', {
      vpc,
      instanceType: InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      securityGroup: bastionGroup,
      subnetSelection: {
        availabilityZones: [subnet.availabilityZone],
        subnets: [subnet]
      }
    });
    Tags.of(host).add('Name', 'BastionLinux');

    // 認証情報へのアクセス許可
    // Secret.fromSecretNameV2(this, 'RDSSecret', props.dbSecretName).grantRead(host);
  }
}
