import { APIGatewayProxyHandler } from 'aws-lambda';
import { executeSingleQuery } from '@/common/persistants/postgres';

export const handler: APIGatewayProxyHandler = async (event) => {
  const result = await executeSingleQuery('select * from electric');
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};