import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as apigw from '@aws-cdk/aws-apigatewayv2-alpha'
import * as intg from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import * as authz from '@aws-cdk/aws-apigatewayv2-authorizers-alpha'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

interface Props extends StackProps {
  projectId: string
  domainPrefix: string
  frontendUrls: string[]
  callbackUrls: string[]
  logoutUrls: string[]
}
export class LambdaWithCognitoStack extends Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props)

    const userPool = new cognito.UserPool(this, `${props.projectId}-userPool`, {
      selfSignUpEnabled: false,
      standardAttributes: {
        // mutable falseにすると、サインイン方法はユーザープール作成時にのみ設定でき後から変更することが出来ない https://qiita.com/shinnoki/items/aa1424128b1cc9b05dac
        email: { required: true, mutable: true },
        phoneNumber: { required: false },
      },
      signInCaseSensitive: true,
      autoVerify: { email: true },
      signInAliases: { email: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    })
    userPool.addDomain(`${props.projectId}-userPool-domain`, {
      cognitoDomain: { domainPrefix: props.domainPrefix },
    })
    const userPoolClient = userPool.addClient('client', {
      oAuth: {
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],

        callbackUrls: props.callbackUrls,
        logoutUrls: props.logoutUrls,
        flows: { authorizationCodeGrant: true },
      },
      // amazon-cognito-identity-jsではクライアントシークレットをサポートしないので false に設定
      // https://github.com/aws-amplify/amplify-js/tree/main/packages/amazon-cognito-identity-js#configuration
      generateSecret: false,
      idTokenValidity: Duration.minutes(5)
    })
    const authorizer = new authz.HttpUserPoolAuthorizer(
      `${props.projectId}-CognitoAuthorizer`,
      userPool,
      {
        authorizerName: 'CognitoAuthorizer',
        userPoolClients: [userPoolClient],
      },
    )

    const handler = new NodejsFunction(
      this,
      `${props.projectId}-hello-lambda`,
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        entry: '../src/handler/api/hello.ts',
        functionName: 'hello',
        description: 'ハロー',
      },
    )

    const httpApi = new apigw.HttpApi(this, `${props.projectId}-apigw`, {
      createDefaultStage: false,
      corsPreflight: {
        allowOrigins: props.frontendUrls,
        allowMethods: [apigw.CorsHttpMethod.ANY],
        allowHeaders: ['authorization', ' Content-Type', 'X-Api-Key',],
        // https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-apigateway.CorsOptions.html
        // authorization headersにはcrredentialsの許可が必要。
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
        allowCredentials: true
      },
    })
    httpApi.addRoutes({
      methods: [apigw.HttpMethod.GET],
      path: '/hello',
      integration: new intg.HttpLambdaIntegration(
        `${props.projectId}-helloIntegration`,
        handler,
      ),
    })
    const handlerWithJwt = new NodejsFunction(
      this,
      `${props.projectId}-hello-lambda-jwt`,
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        entry: '../src/handler/api/helloJwtLambda.ts',
        functionName: 'hello-jwt',
        description: 'ハロー with jwt',
      },
    )

    httpApi.addRoutes({
      methods: [apigw.HttpMethod.GET],
      path: '/hello-jwt',
      integration: new intg.HttpLambdaIntegration(
        `${props.projectId}-scenarioIntegration`,
        handlerWithJwt,
      ),
      authorizer,
    })
    const stage = new apigw.HttpStage(this, `${props.projectId}-apistage`, { httpApi, stageName: 'api', autoDeploy: true, })

    new CfnOutput(this, 'OutputApiUrl', { value: stage.url })
    new CfnOutput(this, 'OutputDomainPrefix', { value: props.domainPrefix })
    new CfnOutput(this, 'OutputUserPoolId', {
      value: userPool.userPoolId,
    })
    new CfnOutput(this, 'OutputClientId', {
      value: userPoolClient.userPoolClientId,
    })

    // cognitoグループを使った認可
    const verifyGroup1LambdaAuthHandler = new NodejsFunction(
      this,
      `verify-group-1-lambda`,
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        entry: '../src/handler/authorizer/apiGatewayV2SimpleAuthorizer.ts',
        functionName: 'apiGatewayV2SimpleAuthorizer',
        description: 'Cognitoのグループをみた認可',
        environment: {
          COGNITO_UER_POOL_ID: userPool.userPoolId,
          COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
          COGNITO_USER_GROUP: 'group_1'
        }
      },
    )
    const lambdaAuthorizerOptions = {
      // https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-apigatewayv2-authorizers-alpha.HttpLambdaAuthorizer.html
      responseTypes: [authz.HttpLambdaResponseType.SIMPLE]
    }
    const lambdaAuthorizer = new authz.HttpLambdaAuthorizer(
      `${props.projectId}-lambdaAuthorizer`,
      verifyGroup1LambdaAuthHandler,
      lambdaAuthorizerOptions,
    )
    const handlerWithLambda = new NodejsFunction(
      this,
      `${props.projectId}-hello-lambda-auth`,
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        entry: '../src/handler/api/helloLambdaAuthed.ts',
        functionName: 'hello-lambda',
        description: 'ハロー with lambda',
      },
    )
    httpApi.addRoutes({
      methods: [apigw.HttpMethod.GET],
      path: '/group1-hello',
      integration: new intg.HttpLambdaIntegration(
        `${props.projectId}-group1-hello`,
        handlerWithLambda,
      ),
      authorizer: lambdaAuthorizer,
    })

    // グループ2の認可
    const verifyGroup2LambdaAuthHandler = new NodejsFunction(
      this,
      `verify-group-2-lambda`,
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        entry: '../src/handler/authorizer/apiGatewayV2SimpleAuthorizer.ts',
        functionName: 'apiGatewayV2SimpleAuthorizerGroup2',
        description: 'Cognitoのグループをみた認可: グループ2',
        environment: {
          COGNITO_UER_POOL_ID: userPool.userPoolId,
          COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
          COGNITO_USER_GROUP: 'group_2'
        }
      },
    )
    const group2LambdaAuthorizer = new authz.HttpLambdaAuthorizer(`${props.projectId}-lambdaAuthorizer-group2`, verifyGroup2LambdaAuthHandler, lambdaAuthorizerOptions)
    httpApi.addRoutes({
      methods: [apigw.HttpMethod.GET],
      path: '/group2-hello',
      integration: new intg.HttpLambdaIntegration(
        `${props.projectId}-group2-hello`,
        handlerWithLambda,
      ),
      authorizer: group2LambdaAuthorizer,
    })
  }
}
