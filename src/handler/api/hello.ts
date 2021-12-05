import { APIGatewayProxyHandler } from 'aws-lambda';

export const echoHandler: APIGatewayProxyHandler = async (event) => {

  return {
    'statusCode': 200,
    'body': JSON.stringify({
      message: 'hello world',
    })
  };
};