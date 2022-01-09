import { APIGatewayProxyHandler } from 'aws-lambda';
import { getPostgresClient } from '@/common/persistants/postgres';

export const handler: APIGatewayProxyHandler = async (event) => {
  const client = await getPostgresClient();
  const result = await client.execute(`insert into electric(id,name,measuredtime,value) values(99,'test',now(),1111);`);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};