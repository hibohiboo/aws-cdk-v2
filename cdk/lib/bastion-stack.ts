import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BastionHostLinux, InstanceType, PublicSubnet, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
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
    host.instance.addUserData(
      'yum -y update',
      'yum install -y postgresql jq', // postgres 9.2がインストールされる。 RDSのpostgres11よりも古いので、より完璧を目指すならpostgres11をインストールしたい
      // DB接続用のbash作成
      "echo '#!/bin/bash' > /usr/bin/dbaccess.sh",
      `echo 'secret=$(aws secretsmanager get-secret-value --region ap-northeast-1 --secret-id ${props.dbSecretName} | jq .SecretString | jq fromjson)' >> /usr/bin/dbaccess.sh`,
      "echo 'user=$(echo $secret | jq -r .username)' >> /usr/bin/dbaccess.sh",
      "echo 'password=$(echo $secret | jq -r .password)' >> /usr/bin/dbaccess.sh",
      "echo 'endpoint=$(echo $secret | jq -r .host)' >> /usr/bin/dbaccess.sh",
      "echo 'PGPASSWORD=$password psql -h $endpoint -U $user -d postgres' >> /usr/bin/dbaccess.sh",
      "chmod 755 /usr/bin/dbaccess.sh",
      // ソケットリレーでポートフォワーディング用のポートを開ける用
      'yum install -y socat',
    );

    // 認証情報へのアクセス許可
    Secret.fromSecretNameV2(this, 'RDSSecret', props.dbSecretName).grantRead(host);
  }
}
