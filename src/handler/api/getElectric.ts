import { APIGatewayProxyHandler } from 'aws-lambda';
import { getPostgresClient } from '@/common/persistants/postgres';

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log(`test1 ${JSON.stringify(event)}`)
  const client = await getPostgresClient();
  console.log('test2')
  const result = await client.execute('select * from electric');
  console.log(result)
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};