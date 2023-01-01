import * as core from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as cognito from '@aws-cdk/aws-cognito-identitypool-alpha';
import { Construct } from 'constructs'
import { basePath } from '../constants/paths'
import { aws_rum as rum } from 'aws-cdk-lib';

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
    const rum = this.createRUM(distribution.distributionDomainName, props.env!.account!, props.env!.region!);
    new core.CfnOutput(this, `${props.distributionName}-rum-name`, {
      value: `${rum.name}`,
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

  private createRUM(domain: string, accountId: string, region: string) {
    // RUMが自動生成するCognitoと同等のCognitoを生成
    const { identityPool, role } = this.createIdentityPool();

    // RUMの生成
    const cfnAppMonitor = new rum.CfnAppMonitor(this, 'MyCfnAppMonitor', {
      // 必須。ドメイン名
      domain,
      // 必須。Monitor の名前。
      name: `rum-for-croudront-${domain}`,

      // the properties below are optional

      // この引数を省略すると、CloudWatch RUM に使用されるサンプル レートはユーザー セッションの 10% に設定される。
      appMonitorConfiguration: {
        // クッキー情報を取得するかどうか。trueにした場合、2つのCookieがRUMでモニタされる。セッションクッキー、ユーザクッキー
        allowCookies: false,

        // AWS X-Ray に情報を連携するかどうか
        enableXRay: false,

        // 除外するページURLのリスト
        // excludedPages: ['excludedPages'],
        // 含めるページURLのリスト。excludePagesと同時に指定はできない。
        // includedPages: ['includedPages'],
        // RUM 上で"favorite"アイコンを付けるURLのリスト
        // favoritePages: ['favoritePages'],

        // Amazon Cognito ID プール設定。(CloudWatch RUM へのデータの送信を承認するために使用)。
        //     Cognito ID プールの ID。
        identityPoolId: identityPool.identityPoolId,
        //     アタッチされているゲスト IAM ロールの ARN。
        guestRoleArn: role.roleArn,

        // サンプルレート。デフォルトは0.1(10%)。1にするとセッションの100%をモニタする。高くするほどコストがかかるので注意。
        sessionSampleRate: 1,

        // テレメトリ。 errors,performance,httpの中から選択。
        //    perfromance ... ページならびにリソースのロード時間に関する情報を収集
        //    errors .... アプリケーションによって発生した未処理の JavaScript エラーに関する情報を収集
        //    http ...  アプリケーションによってスローされた HTTP エラーに関する情報を収集。
        // これらのいずれかを選択しない場合でも、アプリケーションモニターはセッション開始イベントとページ ID を収集する。
        // telemetries: ['http'],

        // // メトリクス送信先
        // metricDestinations: [{
        //   destination: 'destination',

        //   // the properties below are optional
        //   destinationArn: 'destinationArn',
        //   iamRoleArn: 'iamRoleArn',
        //   metricDefinitions: [{
        //     name: 'name',

        //     // the properties below are optional
        //     dimensionKeys: {
        //       dimensionKeysKey: 'dimensionKeys',
        //     },
        //     eventPattern: 'eventPattern',
        //     unitLabel: 'unitLabel',
        //     valueKey: 'valueKey',
        //   }],
        // }],

      },
      // デフォルトでfalse。trueの場合、ログを30日以上保存するように、データのコピーがCloudWatch Logsに作成されるようになる。
      // cwLogEnabled: false,

      // タグの設定も可能。今回は省略する。
      // tags: [{
      //   key: 'key',
      //   value: 'value',
      // }],
    });

    // CognitoIdのIAMロールにRUMへの送信権限を付与
    role.addToPrincipalPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['rum:PutRumEvents'],
      resources: [`arn:aws:rum:${region}:${accountId}:appmonitor/${cfnAppMonitor.name}`],
    }));
    return cfnAppMonitor
  }



  private createIdentityPool(): {
    identityPool: cognito.IIdentityPool
    role: iam.IRole,
  } {
    const identityPool = new cognito.IdentityPool(this, 'IdentityPool', {
      // 匿名認証の有効化
      allowUnauthenticatedIdentities: true,
    });

    return { identityPool, role: identityPool.unauthenticatedRole };
  }


}
