import { APIGatewayProxyHandler } from 'aws-lambda';
import { formatDate } from '../../common/utils/date-util';

export const handler: APIGatewayProxyHandler = async (event) => {
  const datetime = formatDate(new Date(event.requestContext.requestTimeEpoch))
  return {
    'statusCode': 200,
    'body': JSON.stringify({
      message: `hello world. ${datetime} = ${event.requestContext.requestTimeEpoch}`,
    })
  };
};