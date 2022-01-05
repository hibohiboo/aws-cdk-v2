import { Pool } from 'pg';
import { RDS } from 'aws-sdk'
import * as fs from 'fs'
import type { PoolClient } from 'pg';

const signer = new RDS.Signer()
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

const getPool = () => {
  if (process.env.AWS_SAM_LOCAL === 'true') {
    // ローカル実行用。 docker/.envで設定したPostgresへの接続内容。host.docker.internalはdockerコンテナ内からホスト上のサービスに対して接続するときのDNS名。
    const connectionString = 'postgresql://admin:secret@host.docker.internal:5432/postgres';
    return new Pool({ connectionString });
  }

  const { DB_PORT, DB_HOST, DB_USER, DB_DBNAME, SECRET_ACCESS_KEY, SECRET_KEY_ID, AWS_REGION } = process.env;
  if (!DB_PORT) throw new Error(`DB_PORT is undefined`)
  if (!DB_HOST) throw new Error(`DB_HOST is undefined`)
  if (!DB_USER) throw new Error(`DB_USER is undefined`)
  if (!DB_DBNAME) throw new Error(`DB_DBNAME is undefined`)
  if (!AWS_REGION) throw new Error('AWS_REGION is undefined') // RDSとLambdaが同一のリージョンに存在する想定
  if (!SECRET_KEY_ID) throw new Error(`SECRET_KEY_ID is undefined`)
  if (!SECRET_ACCESS_KEY) throw new Error(`SECRET_ACCESS_KEY is undefined`)

  const signerOptions = {
    credentials: {
      accessKeyId: SECRET_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY
    },
    region: AWS_REGION,
    hostname: DB_HOST, // 'example.aslfdewrlk.us-east-1.rds.amazonaws.com',
    port: Number(DB_PORT),
    username: DB_USER,
  }
  // https://node-postgres.com/features/connecting

  return new Pool({
    host: signerOptions.hostname,
    port: signerOptions.port,
    user: signerOptions.username,
    database: DB_DBNAME,
    password: () => signer.getAuthToken(signerOptions),
    ssl: {
      // https://www.amazontrust.com/repository/AmazonRootCA1.pem
      ca: fs.readFileSync('/opt/nodejs/data/AmazonRootCA1.pem')
    }
  });
}

/**
 * Postgresのインスタンスを返却
 * @return {Promise<Postgres>}
 */
const getClient = async () => {
  if (!pool) pool = getPool()
  const postgres = new Postgres();
  await postgres.init();
  return postgres;
};

export const getPostgresClient = getClient;