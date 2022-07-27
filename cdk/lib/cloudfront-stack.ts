import * as core from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import { Construct } from 'constructs'
import { basePath } from '../constants/paths'

interface Props extends core.StackProps {
  bucketName: string
  identityName: string
  defaultCachePolicyName: string
  distributionName: string
  projectNameTag: string
}

export class AWSCloudFrontStack extends core.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props)
    // CloudFront オリジン用のS3バケットを作成
    const bucket = this.createS3(props.bucketName)
    // CloudFront で設定する オリジンアクセスアイデンティティ を作成
    const identity = this.createIdentity(bucket, props.identityName)
    // S3バケットポリシーで、CloudFrontのオリジンアクセスアイデンティティを許可
    this.createPolicy(bucket, identity)
    // CloudFrontディストリビューションを作成
    const distribution = this.createCloudFront(bucket, identity, props)

    // 確認用にCloudFrontのURLに整形して出力
    new core.CfnOutput(this, `${props.distributionName}-top-url`, {
      value: `https://${distribution.distributionDomainName}/${basePath}`,
    })

    new core.CfnOutput(this, `${props.distributionName}-distribution-id`, {
      value: `${distribution.distributionId}`,
    })
    core.Tags.of(this).add('Project', props.projectNameTag)
  }

  private createS3(bucketName: string) {
    const bucket = new s3.Bucket(this, bucketName, {
      bucketName,
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: core.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    })
    return bucket
  }

  private createIdentity(bucket: s3.Bucket, identityName: string) {
    const identity = new cf.OriginAccessIdentity(this, identityName, {
      comment: `${bucket.bucketName} access identity`,
    })
    return identity
  }

  private createPolicy(bucket: s3.Bucket, identity: cf.OriginAccessIdentity) {
    const myBucketPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject', 's3:ListBucket'],
      principals: [
        new iam.CanonicalUserPrincipal(
          identity.cloudFrontOriginAccessIdentityS3CanonicalUserId,
        ),
      ],
      resources: [bucket.bucketArn + '/*', bucket.bucketArn],
    })
    bucket.addToResourcePolicy(myBucketPolicy)
  }

  private createCloudFront(
    bucket: s3.Bucket,
    identity: cf.OriginAccessIdentity,
    props: {
      defaultCachePolicyName: string
      distributionName: string
    },
  ) {
    const {
      defaultCachePolicyName,
      distributionName,
    } = props
    const defaultPolicyOption = {
      cachePolicyName: defaultCachePolicyName,
      comment: 'CloudFrontポリシー',
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    }
    const myCachePolicy = new cf.CachePolicy(
      this,
      defaultCachePolicyName,
      defaultPolicyOption,
    )
    const origin = new origins.S3Origin(bucket, {
      originAccessIdentity: identity,
    })
    const spaRoutingFunction = new cf.Function(this, 'SpaRoutingFunction', {
      functionName: `${props.distributionName}-SpaRoutingFunction`,
      // 拡張子が含まれないURLはSPAファイルにリダイレクト
      code: cf.FunctionCode.fromInline(`
      function handler(event) {
        var request = event.request;
        if (!request.uri.includes('.')){
          request.uri = '/${basePath}/index.html';
        } 
        return request;
      }
      `),
    })
    core.Tags.of(spaRoutingFunction).add('Service', 'Cloud Front Function')

    const d = new cf.Distribution(this, distributionName, {
      // enableIpV6: true,
      // httpVersion: cf.HttpVersion.HTTP2,
      comment: 'CloudFrontデプロイテスト',
      defaultRootObject: '/index.html',
      priceClass: cf.PriceClass.PRICE_CLASS_200,
      defaultBehavior: {
        origin,
        // allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD,
        // cachedMethods: cf.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: myCachePolicy,
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            eventType: cf.FunctionEventType.VIEWER_REQUEST,
            function: spaRoutingFunction,
          },
        ],
      },
      // additionalBehaviors: {
      //   'api/*': {
      //     origin: new origins.HttpOrigin(apiEndPointDomainName, {
      //       customHeaders: {
      //         'x-api-key': props.apiKey,
      //       },
      //     }),
      //     allowedMethods: cf.AllowedMethods.ALLOW_ALL,
      //     viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      //     cachePolicy: new cf.CachePolicy(
      //       this,
      //       `${distributionName}-rest-api-cache-policy`,
      //       {
      //         cachePolicyName: `${distributionName}-rest-api-cache-policy`,
      //         comment: 'CloudFront + ApiGateway用ポリシー',
      //         // defaultTtl: core.Duration.seconds(0),
      //         // maxTtl: core.Duration.seconds(0),
      //         // minTtl: core.Duration.seconds(0),
      //         headerBehavior: cf.CacheHeaderBehavior.allowList(
      //           'x-api-key',
      //           'content-type',
      //         ),
      //       },
      //     ),
      //   },
      // },
      // 2021.09.05 GUIコンソール上の推奨とCDKのデフォルト値がずれていたので明示 → 修正された
      // minimumProtocolVersion: cf.SecurityPolicyProtocol.TLS_V1_2_2021,
      // Route53と連携するためのカスタムドメイン
      // certificate: cert,
      // domainNames: [deployDomain],
    })
    core.Tags.of(d).add('Service', 'Cloud Front')

    return d
  }
}
