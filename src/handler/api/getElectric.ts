import { APIGatewayProxyHandler } from 'aws-lambda';
import { getPostgresClient } from '@/common/persistants/postgres';

export const handler: APIGatewayProxyHandler = async (event) => {
  const client = await getPostgresClient();
  const result = await client.execute('select * from electric');
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};