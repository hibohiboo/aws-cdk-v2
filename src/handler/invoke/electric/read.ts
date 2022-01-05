import type { Handler } from 'aws-lambda';
import { format } from 'date-fns';
import { formatDate } from '@/common/index';
import { getPostgresClient } from '@/common/persistants/postgres';

export const handler: Handler = async () => {
  const client = await getPostgresClient();
  const result = await client.execute('select * from electric');
  await client.release();
  console.log(result);
  return JSON.stringify(result);
};