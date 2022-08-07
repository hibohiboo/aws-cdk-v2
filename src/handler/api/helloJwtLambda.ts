import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { format } from 'date-fns';
import { formatDate } from '@/common/index';
import { corsHeaders } from '@/domain/http/const';

// https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/services-apigateway.html
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  console.log(`test:event -> ${JSON.stringify(event)}`)
  console.log(`test:env -> ${JSON.stringify(process.env)}`)
  console.log(`test.context ->`, JSON.stringify(event.requestContext))
  const datetime = formatDate(new Date(event.requestContext.timeEpoch));

  return {
    'statusCode': 200,
    headers: corsHeaders,
    'body': JSON.stringify({
      message: `hello world ${event.requestContext.authorizer.jwt.claims.email}. ${datetime} = ${event.requestContext.timeEpoch}. now: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS')}`,
    })
  };
};