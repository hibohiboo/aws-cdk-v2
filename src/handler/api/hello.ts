import { APIGatewayProxyHandler } from 'aws-lambda';
import { format } from 'date-fns';
import { formatDate } from '@/common/index';

export const handler: APIGatewayProxyHandler = async (event) => {
  const datetime = formatDate(new Date(event.requestContext.requestTimeEpoch));
  console.log(`test:event -> ${JSON.stringify(event)}`)
  console.log(`test:env -> ${JSON.stringify(process.env)}`)

  return {
    'statusCode': 200,
    'body': JSON.stringify({
      message: `hello world. ${datetime} = ${event.requestContext.requestTimeEpoch}. now: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS')}`,
    })
  };
};