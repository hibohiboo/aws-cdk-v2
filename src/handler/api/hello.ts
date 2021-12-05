import { APIGatewayProxyHandler } from 'aws-lambda';
import { format } from 'date-fns';
import { formatDate } from '/opt/nodejs/index';

export const handler: APIGatewayProxyHandler = async (event) => {
  const datetime = formatDate(new Date(event.requestContext.requestTimeEpoch))
  return {
    'statusCode': 200,
    'body': JSON.stringify({
      message: `hello world. ${datetime} = ${event.requestContext.requestTimeEpoch}. now: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS')}`,
    })
  };
};