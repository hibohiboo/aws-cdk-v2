import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

export class Cdk2026Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    const eiceSecurityGroup = new ec2.SecurityGroup(this, 'EiceSecurityGroup', {
      vpc,
      description: 'Security group for EC2 Instance Connect Endpoint',
    });

    const auroraSecurityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {
      vpc,
      description: 'Security group for Aurora MySQL Serverless V2',
      allowAllOutbound: false,
    });

    const AURORA_PORT = 3389;

    auroraSecurityGroup.addIngressRule(ec2.Peer.securityGroupId(eiceSecurityGroup.securityGroupId), ec2.Port.tcp(AURORA_PORT));

    const auroraCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_12_0,
      }),
      writer: rds.ClusterInstance.serverlessV2('writer'),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 4,
      port: AURORA_PORT,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [auroraSecurityGroup],
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      defaultDatabaseName: 'my-app',
      storageEncrypted: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const isolatedSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    });

    new ec2.CfnInstanceConnectEndpoint(this, 'EiceEndpoint', {
      subnetId: isolatedSubnets.subnetIds[0],
      securityGroupIds: [eiceSecurityGroup.securityGroupId],
      preserveClientIp: false,
    });

    new cdk.CfnOutput(this, 'AuroraClusterEndpoint', {
      value: auroraCluster.clusterEndpoint.hostname,
      description: 'Aurora cluster endpoint for open-tunnel --remote-host',
    });
  }
}
