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

    // allowAllOutbound: true (デフォルト) にして AuroraSecurityGroup との循環参照を防ぐ
    const verifiedAccessSg = new ec2.SecurityGroup(this, 'VerifiedAccessEndpointSg', {
      vpc,
      description: 'Security group for Verified Access endpoint',
    });

    const auroraSecurityGroup = new ec2.SecurityGroup(this, 'AuroraSecurityGroup', {
      vpc,
      description: 'Security group for Aurora MySQL Serverless V2',
      allowAllOutbound: false,
    });

    const AURORA_PORT = 3306;

    auroraSecurityGroup.addIngressRule(ec2.Peer.securityGroupId(verifiedAccessSg.securityGroupId), ec2.Port.tcp(AURORA_PORT));

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
      defaultDatabaseName: 'myapp',
      storageEncrypted: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const isolatedSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    });

    // IAM Identity Center を信頼プロバイダーとして使用 (アカウント内に事前設定が必要)
    const trustProvider = new ec2.CfnVerifiedAccessTrustProvider(this, 'VerifiedAccessTrustProvider', {
      trustProviderType: 'user',
      userTrustProviderType: 'iam-identity-center',
      policyReferenceName: 'idc',
      description: 'IAM Identity Center trust provider for Aurora MySQL access',
    });

    const verifiedAccessInstance = new ec2.CfnVerifiedAccessInstance(this, 'VerifiedAccessInstance', {
      description: 'Verified Access instance for Aurora MySQL access',
      verifiedAccessTrustProviderIds: [trustProvider.attrVerifiedAccessTrustProviderId],
    });

    const verifiedAccessGroup = new ec2.CfnVerifiedAccessGroup(this, 'VerifiedAccessGroup', {
      verifiedAccessInstanceId: verifiedAccessInstance.attrVerifiedAccessInstanceId,
      description: 'Verified Access group for Aurora MySQL access',
      // 全認証ユーザーを許可。本番環境では context.idc.user.email 等で制限すること
      policyDocument: 'permit(principal, action, resource) when { true };',
      policyEnabled: true,
    });

    new cdk.CfnOutput(this, 'AuroraClusterEndpoint', {
      value: auroraCluster.clusterEndpoint.hostname,
      description: 'Aurora cluster endpoint hostname',
    });

    // 1日中使うと
    // 5$程度必要なので、使う時だけ作成
    // const verifiedAccessEndpoint = new ec2.CfnVerifiedAccessEndpoint(this, 'VerifiedAccessEndpoint', {
    //   attachmentType: 'vpc',
    //   endpointType: 'rds',
    //   verifiedAccessGroupId: verifiedAccessGroup.attrVerifiedAccessGroupId,
    //   securityGroupIds: [verifiedAccessSg.securityGroupId],
    //   rdsOptions: {
    //     rdsDbClusterArn: auroraCluster.clusterArn,
    //     rdsEndpoint: auroraCluster.clusterEndpoint.hostname,
    //     subnetIds: isolatedSubnets.subnetIds,
    //     port: AURORA_PORT,
    //     protocol: 'tcp',
    //   },
    //   description: 'Verified Access RDS endpoint for Aurora MySQL cluster',
    //   policyDocument: 'permit(principal, action, resource) when { true };',
    //   policyEnabled: true,
    // });

    // new cdk.CfnOutput(this, 'VerifiedAccessEndpointDomain', {
    //   value: verifiedAccessEndpoint.attrEndpointDomain,
    //   description: 'Verified Access endpoint domain (DBクライアントのホストに指定)',
    // });
  }
}
