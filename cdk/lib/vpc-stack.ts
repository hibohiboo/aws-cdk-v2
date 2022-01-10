import { Aspects, Stack, StackProps, Tag, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Peer, Port, PrivateSubnet, PrivateSubnetProps, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { SubnetGroup } from 'aws-cdk-lib/aws-rds';
import { StringListParameter } from 'aws-cdk-lib/aws-ssm';

const DB_PORT = 5432;

interface VpcStackProps extends StackProps {
  subnetGroupName: string
  ssmParamKeySubnetIds: string
}
export class VpcStack extends Stack {
  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, { ...props, subnetGroupName: undefined } as StackProps);
    const cidr = '10.0.0.0/16';
    const vpc = new Vpc(this, 'VPC', {
      cidr,
      natGateways: 0, // デフォルトは1。
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public-subnet",
          subnetType: SubnetType.PUBLIC
        },
        // privateの設定を自動で行うと、SubnetGroupのsubnetsの指定に失敗する。
        //  Property SubnetIds cannot be empty. ... vpc.privateSubnetsが空に見えている模様。
        // {
        //   cidrMask: 24,
        //   name: "public-subnet",
        //   subnetType: SubnetType.PRIVATE_ISOLATED
        // }
      ], // デフォルトはAZごとに１つのパブリックサブネットと１つのプライベートサブネット
      maxAzs: 3 // 3を指定すると、 public: 10.0.0.0 - 10.0.0.2 の3つ分のcidrBlockが使われる。
    })
    // Tags.of(vpc).add('Stack', id);
    Tags.of(vpc).add('Name', 'vpc');

    // プライベートSubnet（RDS用）
    const privateSubnetProps: PrivateSubnetProps[] = [
      { availabilityZone: 'ap-northeast-1a', vpcId: vpc.vpcId, cidrBlock: '10.0.3.0/24' },
      { availabilityZone: 'ap-northeast-1c', vpcId: vpc.vpcId, cidrBlock: '10.0.4.0/24' },
      // ap-northeast-1b は使えない
      { availabilityZone: 'ap-northeast-1d', vpcId: vpc.vpcId, cidrBlock: '10.0.5.0/24' },
    ]

    const subnets = privateSubnetProps.map((prop, i) => {
      const subnet = new PrivateSubnet(this, `MyPrivateSubnet${i}`, prop);
      Tags.of(subnet).add('Name', `private-subnet-${i}`);
      Tags.of(subnet).add('aws-cdk:subnet-type', SubnetType.PRIVATE_ISOLATED);
      return subnet
    });

    // // パブリックSubnet
    // const internetGateway = new CfnInternetGateway(this, "InternetGateway");
    // Tags.of(internetGateway).add('Name', `internetGateway`);
    // const gatewayAttachment = new CfnVPCGatewayAttachment(this, "gateway", {
    //   vpcId: vpc.vpcId,
    //   internetGatewayId: internetGateway.ref
    // })
    // Tags.of(gatewayAttachment).add('Name', `GatewayAttachment`);

    // const publicSubnet = new PublicSubnet(this, `MyPublicSubnet`, {
    //   vpcId: vpc.vpcId,
    //   availabilityZone: 'ap-northeast-1a',
    //   cidrBlock: '10.0.1.0/24',
    //   mapPublicIpOnLaunch: true
    // });
    // Tags.of(publicSubnet).add('Name', `public-subnet`);
    // Tags.of(publicSubnet).add('aws-cdk:subnet-type', SubnetType.PUBLIC);

    // publicSubnet.addRoute("PubSubnetRoute", {
    //   routerType: RouterType.GATEWAY,
    //   routerId: internetGateway.ref
    // })

    //------------------ Aurora用の設定 ----------------------------------
    const dbConnectionGroup = new SecurityGroup(this, 'SecurityGroupForPrivateSubnets', {
      vpc,
      description: 'seburity group for Aurora'
    })
    Tags.of(dbConnectionGroup).add('Name', 'SecurityGroupForPrivateSubnets');
    // securityGroupPrivate.addIngressRule(Peer.ipv4(cidr), Port.allTcp());

    const subnetGroupForAurora = new SubnetGroup(this, 'SubnetGroupForAurora', {
      vpc,
      vpcSubnets: { subnets },
      description: 'subnet group for Aurora db',
      subnetGroupName: props.subnetGroupName
    });
    Tags.of(subnetGroupForAurora).add('Name', 'SubnetGroupForAurora');

    // 読取専用 RDSProxyのエンドポイントを作るためにSubnetIdのリストが必要
    const subnetIds = subnets.map(subnet => subnet.subnetId);
    const subnetIdsParameter = new StringListParameter(this, "ssm-subnet-ids", {
      parameterName: props.ssmParamKeySubnetIds,
      stringListValue: subnetIds,
      description: 'private subnet ids for rds proxy readonly endpoint'
    });
    Tags.of(subnetIdsParameter).add('Name', 'ssm-subnet-ids');

    //------------------ 踏み台用の設定 ----------------------------------
    const securityGroupPublic = new SecurityGroup(this, 'SecurityGroupForPublicSubnets', {
      vpc,
      description: 'seburity group for bastion'
    })
    Tags.of(securityGroupPublic).add('Name', 'SecurityGroupForPublicSubnets');
    dbConnectionGroup.addIngressRule(securityGroupPublic, Port.tcp(DB_PORT));

    //------------------ Lambda用の設定 ----------------------------------
    // We need this security group to add an ingress rule and allow our lambda to query the proxy
    const lambdaToRDSProxyGroup = new SecurityGroup(this, 'Lambda to RDS Proxy Connection', {
      vpc,
      description: 'seburity group for lambda'
    });
    Tags.of(lambdaToRDSProxyGroup).add('Name', 'SecurityGroupForPrivateSubnetsForLambda');
    dbConnectionGroup.addIngressRule(lambdaToRDSProxyGroup, Port.tcp(DB_PORT), 'allow lambda connection');
    //------------------ 共通設定 ----------------------------------
    // 作成したリソース全てにタグをつける
    Aspects.of(this).add(new Tag('Stack', id));

  }
}
