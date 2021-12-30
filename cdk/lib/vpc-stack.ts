import { Aspects, Stack, StackProps, Tag, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnRoute, CfnRouteTable, Peer, Port, PrivateSubnet, PrivateSubnetProps, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { SubnetGroup } from 'aws-cdk-lib/aws-rds';

interface VpcStackProps extends StackProps {
  subnetGroupName: string
}
export class VpcStack extends Stack {
  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, { ...props, subnetGroupName: undefined } as StackProps);
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
      Tags.of(subnet).add('Name', `private-subnet-${i}`);
      return subnet
    });

    //------------------ Aurora用の設定 ----------------------------------
    const securityGroupPrivate = new SecurityGroup(this, 'SecurityGroupForPrivateSubnts', {
      vpc,
      description: 'seburity group for Aurora and vpc lambda'
    })
    Tags.of(securityGroupPrivate).add('Name', 'SecurityGroupForPrivateSubnts');
    securityGroupPrivate.addIngressRule(Peer.ipv4(cidr), Port.allTcp());

    const sebnetGroupForAurora = new SubnetGroup(this, 'SubnetGroupForAurora', {
      vpc,
      vpcSubnets: { subnets },
      description: 'subnet group for Aurora db',
      subnetGroupName: props.subnetGroupName
    });
    Tags.of(sebnetGroupForAurora).add('Name', 'SubnetGroupForAurora');
    // 作成したリソース全てにタグをつける
    Aspects.of(this).add(new Tag('Stack', id));

  }
}
