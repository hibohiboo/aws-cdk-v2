import { APIGatewayProxyHandlerV2WithLambdaAuthorizer } from 'aws-lambda';
import { format } from 'date-fns';
import { formatDate } from '@/common/index';
import { corsHeaders } from '@/domain/http/const';
import { AuthorizedCognitoContext } from '../authorizer/apiGatewayV2SimpleAuthorizer';


export const handler: APIGatewayProxyHandlerV2WithLambdaAuthorizer<AuthorizedCognitoContext> = async (event) => {
  console.log(`test:event -> ${JSON.stringify(event)}`)
  const datetime = formatDate(new Date(event.requestContext.timeEpoch));

  return {
    'statusCode': 200,
    headers: corsHeaders,
    'body': JSON.stringify({
      message: `hello world ${event.requestContext.authorizer.lambda.email}. ${datetime} = ${event.requestContext.timeEpoch}. now: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS')}`,
    })
  };
};