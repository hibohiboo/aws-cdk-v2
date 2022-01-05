import { Pool, PoolConfig } from 'pg';
import type { PoolClient } from 'pg';
const { RDS } = require('aws-sdk')
// const username = 'hoge';
// // https://node-postgres.com/features/connecting
// const signerOptions = {
//   region: 'us-east-1',
//   hostname: 'example.aslfdewrlk.us-east-1.rds.amazonaws.com',
//   port: 5432,
//   username: 'api-user',
// }
// const signer = new RDS.Signer()
// const getPassword = () => signer.getAuthToken(signerOptions)
// const pool = new Pool({
//   host: signerOptions.hostname,
//   port: signerOptions.port,
//   user: signerOptions.username,
//   database: 'my-db',
//   password: getPassword,
// });

const connectionString = '';
let pool: Pool | null = null;

/**
 * Postgresクラス
 */
class Postgres {
  #client: PoolClient

  /**
   * Poolからclientを取得
   * @return {Promise<void>}
   */
  async init() {
    if (!pool) throw new Error('pool is undefined')
    this.#client = await pool.connect();
  }

  /**
   * SQLを実行
   * @param query
   * @param params
   * @return {Promise<*>}
   */
  async execute(query: string, params = []) {
    return (await this.#client.query(query, params)).rows;
  }

  /**
   * 取得したクライアントを解放してPoolに戻す
   * @return {Promise<void>}
   */
  async release() {
    await this.#client.release(true);
  }

  /**
   * Transaction Begin
   * @return {Promise<void>}
   */
  async begin() {
    await this.#client.query('BEGIN');
  }

  /**
   * Transaction Commit
   * @return {Promise<void>}
   */
  async commit() {
    await this.#client.query('COMMIT');
  }

  /**
   * Transaction Rollback
   * @return {Promise<void>}
   */
  async rollback() {
    await this.#client.query('ROLLBACK');
  }
}

/**
 * Postgresのインスタンスを返却
 * @return {Promise<Postgres>}
 */
const getClient = async () => {
  const { DB_PORT, DB_HOST, DB_USER } = process.env;
  // if (!DB_PORT) throw new Error(`DB_PORT is undefined`)
  // if (!DB_HOST) throw new Error(`DB_HOST is undefined`)
  // if (!DB_USER) throw new Error(`DB_USER is undefined`)
  // const connectionString = 'postgresql://admin:secret@host.docker.internal:5432/postgres';
  // if (!pool) pool = new Pool({ connectionString });
  const config: PoolConfig = {
    port: 5432,
    host: 'host.docker.internal',
    user: 'admin',
    password: 'secret',
    database: 'postgres',
  }
  if (!pool) pool = new Pool(config);
  const postgres = new Postgres();
  await postgres.init();
  return postgres;
};

export const getPostgresClient = getClient;