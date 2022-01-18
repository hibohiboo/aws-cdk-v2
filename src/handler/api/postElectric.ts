import { APIGatewayProxyHandler } from 'aws-lambda';
import { executeTransaction } from '@/common/persistants/postgres';

export const handler: APIGatewayProxyHandler = async (event) => {

  if (!event.queryStringParameters || !event.queryStringParameters.name) {
    return {
      statusCode: 400,
      body: JSON.stringify('query parameter must have [name]')
    };
  }

  let result = null;
  await executeTransaction(async (client) => {
    const count = (await client.execute('select count(*) cnt from electric'))[0].cnt;
    result = await client.execute(`insert into electric(id,name,measuredtime,value) values($1,$2,now(),1111) RETURNING *`, [count, event.queryStringParameters!.name]);
  })

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};