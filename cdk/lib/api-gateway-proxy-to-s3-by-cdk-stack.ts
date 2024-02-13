import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AwsIntegration, Cors, MethodLoggingLevel, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// https://dev.classmethod.jp/articles/api-gateway-proxy-to-s3-put-object-by-cdk/
// https://qiita.com/hibohiboo/items/0026418971669aa1cf77
export class ApiGatewayProxyToS3ByCdkStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & { projectId: string }) {
    super(scope, id, props);

    const projectName: string = props.projectId;
    const bucket = this.createBucket(projectName);
    const restApiRole = this.createRole(bucket);
    const restApi = this.createRestApi(projectName);

    // リソースを作成する `/test`
    const test = restApi.root.addResource('test');
    test.addMethod('PUT', this.createIntegration(restApiRole, bucket), {
      requestParameters: {},
      methodResponses: [this.createOkResponse(), this.create400Response(), this.createErrorResponse()],
    });
  }
  private createBucket(projectName: string) {
    const bucket = new Bucket(this, 'Bucket', { bucketName: `${projectName}-proxy-to-bucket`, removalPolicy: RemovalPolicy.DESTROY });
    return bucket;
  }
  private createRole(bucket: Bucket) {
    const restApiRole = new Role(this, 'Role', { assumedBy: new ServicePrincipal('apigateway.amazonaws.com'), path: '/' });
    bucket.grantReadWrite(restApiRole);
    return restApiRole;
  }
  private createRestApi(projectName: string) {
    const restApi = new RestApi(this, 'RestApi', {
      restApiName: `${projectName}-api`,
      deployOptions: {
        stageName: 'v1',
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      // defaultCorsPreflightOptions: {
      //   allowOrigins: Cors.ALL_ORIGINS,
      //   allowMethods: ['POST', 'OPTIONS', 'PUT', 'DELETE'],
      //   statusCode: 200,
      // },
    });
    return restApi;
  }
  private createIntegration(restApiRole: Role, bucket: Bucket) {
    // https://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration-requestParameters.html
    const responseParameters = {
      'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
      'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST,PUT,GET,DELETE'",
      'method.response.header.Access-Control-Allow-Origin': "'*'",
    };
    return new AwsIntegration({
      service: 's3',
      integrationHttpMethod: 'PUT',
      // アップロード先を指定する
      path: `${bucket.bucketName}/{folder}/{object}.json`,
      options: {
        credentialsRole: restApiRole,
        passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
        // https://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/http-api-logging-variables.html
        requestParameters: {
          // リクエストのEpoc を 統合リクエストのパスパラメータ folder にマッピングする
          'integration.request.path.folder': 'context.requestTimeEpoch',
          // API Gateway が API リクエストに割り当てる IDを 統合リクエストの object にマッピングする。
          'integration.request.path.object': 'context.requestId',
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              ...responseParameters,
              'method.response.header.Timestamp': 'integration.response.header.Date',
              'method.response.header.Content-Length': 'integration.response.header.Content-Length',
              'method.response.header.Content-Type': 'integration.response.header.Content-Type',
            },
          },
          {
            statusCode: '400',
            selectionPattern: '4\\d{2}',
            responseParameters,
          },
          {
            statusCode: '500',
            selectionPattern: '5\\d{2}',
            responseParameters,
          },
        ],
      },
    });
  }
  private createOkResponse() {
    return {
      statusCode: '200',
      responseParameters: {
        'method.response.header.Timestamp': true,
        'method.response.header.Content-Length': true,
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    };
  }
  private create400Response() {
    return {
      statusCode: '400',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    };
  }
  private createErrorResponse() {
    return {
      statusCode: '500',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    };
  }
}
