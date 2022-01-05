import { Pool } from 'pg';
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

const connectionString = 'postgresql://admin:secret@host.docker.internal:5432/postgres';
const pool = new Pool({ connectionString });

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
  const postgres = new Postgres();
  await postgres.init();
  return postgres;
};

export const getPostgresClient = getClient;