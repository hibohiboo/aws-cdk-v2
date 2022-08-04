import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as apigw from '@aws-cdk/aws-apigatewayv2-alpha'
import * as intg from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import * as authz from '@aws-cdk/aws-apigatewayv2-authorizers-alpha'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
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
      `${props.projectId}-scenario-lambda`,
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        entry: '../src/handler/api/hello.ts',
        functionName: 'scenario',
        description: 'シナリオ',
      },
    )

    const httpApi = new apigw.HttpApi(this, `${props.projectId}-apigw`, {
      createDefaultStage: false,
      corsPreflight: {
        allowOrigins: props.frontendUrls,
        allowMethods: [apigw.CorsHttpMethod.ANY],
        allowHeaders: ['authorization'],
      },
    })

    httpApi.addRoutes({
      methods: [apigw.HttpMethod.GET],
      path: '/scenario',
      integration: new intg.HttpLambdaIntegration(
        `${props.projectId}-scenarioIntegration`,
        handler,
      ),
      authorizer,
    })
    const stage = new apigw.HttpStage(this, `${props.projectId}-apistage`, {
      httpApi,
      stageName: 'api',
      autoDeploy: true,
    })

    new CfnOutput(this, 'OutputApiUrl', { value: stage.url })
    new CfnOutput(this, 'OutputDomainPrefix', { value: props.domainPrefix })
    new CfnOutput(this, 'OutputUserPoolId', {
      value: userPool.userPoolId,
    })
    new CfnOutput(this, 'OutputClientId', {
      value: userPoolClient.userPoolClientId,
    })


  }
}
