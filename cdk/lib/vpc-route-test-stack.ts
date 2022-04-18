import { Aspects, Stack, StackProps, Tag, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnInternetGateway, CfnRoute, CfnRouteTable, CfnSubnet, CfnSubnetRouteTableAssociation, CfnVPCGatewayAttachment, PrivateSubnet, PrivateSubnetProps, PublicSubnet, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';

interface VpcStackProps extends StackProps {

}
export class VpcRouteTestStack extends Stack {
  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, { ...props, subnetGroupName: undefined } as StackProps);
    const cidr = '10.1.0.0/16';
    const vpc = new Vpc(this, 'VPC', {
      cidr,
      natGateways: 0, // デフォルトは1。
      subnetConfiguration: [], // サブネットの自動作成はなし。
    })
    // Tags.of(vpc).add('Stack', id);
    Tags.of(vpc).add('Name', 'vpc');


    const publicSubnet = new CfnSubnet(this, "lab-subnet", {
      vpcId: vpc.vpcId,
      cidrBlock: "10.1.0.0/24",
      availabilityZone: this.availabilityZones[0],
      tags: [{ key: "Name", value: "lab-subnet" }]
    });

    const igw = new CfnInternetGateway(this, "lab-igw", {
      tags: [{ key: "Name", value: "lab-igw" }]
    });

    const igwAttach = new CfnVPCGatewayAttachment(this, "lab-igw-attach", {
      vpcId: vpc.vpcId,
      internetGatewayId: igw.ref
    });

    const publicRouteTable = new CfnRouteTable(this, "lab-public-route", {
      vpcId: vpc.vpcId,
      tags: [{ key: "Name", value: "public-rt" }]
    });

    const igwRoute = new CfnRoute(this, "lab-public-route-igw", {
      routeTableId: publicRouteTable.ref,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.ref
    });

    const association = new CfnSubnetRouteTableAssociation(this, "lab-public-route-association", {
      routeTableId: publicRouteTable.ref,
      subnetId: publicSubnet.ref
    });

    // ---------------------------------------------------------
    // private
    const privateRouteTable = new CfnRouteTable(this, "lab-private-route", {
      vpcId: vpc.vpcId,
      tags: [{ key: "Name", value: "private-rt" }]
    });

    // プライベートSubnet
    const privateSubnetProps: PrivateSubnetProps[] = [
      { availabilityZone: 'ap-northeast-1a', vpcId: vpc.vpcId, cidrBlock: '10.1.1.0/24', },
      { availabilityZone: 'ap-northeast-1c', vpcId: vpc.vpcId, cidrBlock: '10.1.2.0/24' },
      // ap-northeast-1b は使えない
      { availabilityZone: 'ap-northeast-1d', vpcId: vpc.vpcId, cidrBlock: '10.1.3.0/24' },
    ]

    const subnets = privateSubnetProps.map((prop, i) => {
      const subnet = new CfnSubnet(this, `MyPrivateSubnet${i}`, {
        vpcId: vpc.vpcId,
        cidrBlock: prop.cidrBlock,
        availabilityZone: prop.availabilityZone,
        tags: [{ key: "Name", value: `MyPrivateSubnet${i}` }]
      });
      Tags.of(subnet).add('Name', `private-subnet-${i}`);
      Tags.of(subnet).add('aws-cdk:subnet-type', SubnetType.PRIVATE_ISOLATED);
      new CfnSubnetRouteTableAssociation(this, `MyPrivateSubnet-associations-${i}`, {
        routeTableId: privateRouteTable.ref,
        subnetId: subnet.ref
      })
      return subnet
    });


    //------------------ 共通設定 ----------------------------------
    // 作成したリソース全てにタグをつける
    Aspects.of(this).add(new Tag('Stack', id));

  }
}
