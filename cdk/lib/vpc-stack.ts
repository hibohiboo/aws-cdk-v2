import { Aspects, Stack, StackProps, Tag, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnRoute, CfnRouteTable, Peer, Port, PrivateSubnet, PrivateSubnetProps, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';

export class VpcStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const cidr = '10.0.0.0/16';
    const vpc = new Vpc(this, 'VPC', {
      cidr,
      natGateways: 0, // デフォルトは1。
      subnetConfiguration: [], // デフォルトはAZごとに１つのパブリックサブネットと１つのプライベートサブネット
    })
    // Tags.of(vpc).add('Stack', id);
    Tags.of(vpc).add('Name', 'vpc');

    const privateSubnetProps: PrivateSubnetProps[] = [
      { availabilityZone: 'ap-northeast-1a', vpcId: vpc.vpcId, cidrBlock: '10.0.2.0/24' },
      { availabilityZone: 'ap-northeast-1c', vpcId: vpc.vpcId, cidrBlock: '10.0.3.0/24' },
      // ap-northeast-1b は使えない
      { availabilityZone: 'ap-northeast-1d', vpcId: vpc.vpcId, cidrBlock: '10.0.4.0/24' },
    ]

    const subnets = privateSubnetProps.map((prop, i) => {
      const subnet = new PrivateSubnet(this, `MyPrivateSubnet${i}`, prop);
      Tags.of(vpc).add('Name', `private-subnet-${i}`);
      return subnet
    });

    const securityGroupPrivate = new SecurityGroup(this, 'SecurityGroupForPrivateSubnts', {
      vpc,
      description: 'seburity group for Aurora'
    })
    Tags.of(securityGroupPrivate).add('Name', 'SecurityGroupForPrivateSubnts');
    securityGroupPrivate.addIngressRule(Peer.ipv4(cidr), Port.allTcp());

    // 作成したリソース全てにタグをつける
    Aspects.of(this).add(new Tag('Stack', id));

  }
}
