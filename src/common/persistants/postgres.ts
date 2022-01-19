import { Pool } from 'pg';
import { RDS, SecretsManager } from 'aws-sdk'
import * as fs from 'fs'
import type { PoolClient } from 'pg';

const RETRY_COUNT = 5;
const RETRY_INTERVAL_MILLI_SECOND = 100; // 0.1秒
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

    for (let i = 0; i < RETRY_COUNT; i++) {
      try {
        this.#client = await pool.connect();
        return;
      } catch (e) {
        // RDS ProxyのIAM認証がtrueになっていると、The IAM authentication failed for the role ロール名. Check the IAM token for this role and try again.のエラーが発生することがある
        // 原因1: lambdaのPolicyStatement不足(rds-connect)
        // 原因2: lambdaのPolicyStatementに指定したユーザ名と接続しようとしているユーザ名が異なる

        // This RDS proxy has no credentials for the role user1. Check the credentials for this role and try again
        // 原因: ＣＤＫの、new DatabaseProxy(this, 'Proxy', { secrets: [],...)のsecretsの配列に使用したいユーザ・パスワードが入っていない。
        // permission denied for table electric
        // 原因: 使用しているユーザに該当するテーブルへの操作権限がない（insertなど）

        // The password that was provided for the role ロール名 is wrong
        // 原因: IAM認証を使用していないのにgetAuthTokenを使って接続しようとしている。IAM認証を使わない場合は、passwordにはパスワードの文字列が必要

        console.warn(`error try ${i}`, e);
        // pool = null; // テスト用。 getPool()で失敗する接続文字列でもインスタンスは返却される。
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MILLI_SECOND)); // 1秒待つ
      }
    }
    throw new Error('connect failed')
  }

  /**
   * SQLを実行
   * @param query
   * @param params
   * @return {Promise<*>}
   */
  async execute(query: string, params: any[] = []) {
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

// 接続テスト用。3回目で接続成功
// let testCount = 0;
const getPool = () => {
  if (process.env.AWS_SAM_LOCAL === 'true') {
    // ローカル実行用。admin。 docker/.envで設定したPostgresへの接続内容。host.docker.internalはdockerコンテナ内からホスト上のサービスに対して接続するときのDNS名。
    const connectionString = 'postgresql://admin:secret@host.docker.internal:5432/postgres';

    // 接続テスト用
    // const connectionString = testCount === 3 ? 'postgresql://admin:secret@host.docker.internal:5432/postgres' : '';

    // ローカル実行用。user1。 GRANTでテーブルへの権限をつけ忘れると、「error: permission denied for relation electric」って言われる。（electricはテーブル名)
    // const connectionString = 'postgresql://user1:pass@host.docker.internal:5432/postgres';


    return new Pool({ connectionString });
  }

  const { DB_PORT, DB_HOST, DB_USER, DB_DBNAME, AWS_REGION } = process.env;
  if (!DB_PORT) throw new Error(`DB_PORT is undefined`)
  if (!DB_HOST) throw new Error(`DB_HOST is undefined`)
  if (!DB_USER) throw new Error(`DB_USER is undefined`)
  if (!DB_DBNAME) throw new Error(`DB_DBNAME is undefined`)
  if (!AWS_REGION) throw new Error('AWS_REGION is undefined') // RDSとLambdaが同一のリージョンに存在する想定

  const signerOptions = {
    region: AWS_REGION,// us-east-1,
    hostname: DB_HOST, // 'example.aslfdewrlk.us-east-1.rds.amazonaws.com',
    port: Number(DB_PORT), // us-east-1,
    username: DB_USER,
  }
  // https://node-postgres.com/features/connecting
  // https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/configuration-database.html
  // https://htnosm.hatenablog.com/entry/2021/08/23/090000

  return new Pool({
    host: signerOptions.hostname,
    port: signerOptions.port,
    user: signerOptions.username,
    database: DB_DBNAME,
    // IAM認証のため、パスワードの代わりにトークンを使用する。
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
  if (!pool) pool = getPool();
  const postgres = new Postgres();
  await postgres.init();
  return postgres;
};

/**
 * 一度しか実行せず、トランザクションが不要な場合のベストプラクティス。
 * クライアントのリリース忘れを防ぐ
 * 参考: https://node-postgres.com/features/pooling
 * 
 * @param query 
 * @param params 
 * @returns 
 */
export const executeSingleQuery = async (query: string, params: any[] = []) => {
  if (!pool) pool = getPool();
  for (let i = 0; i < RETRY_COUNT; i++) {
    try {
      const ret = await pool.query(query, params);
      return ret.rows;
    } catch (e) {
      console.warn(`error try ${i}`, e);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MILLI_SECOND));
    }
  }
  throw new Error('connect failed')
}

/**
 * トランザクションを実行する。
 * @param executeQuery 実行クエリを含んだ関数。引数にトランザクションを開始したPostgresクライアントが渡される。
 */
export const executeTransaction = async (executeQuery: (client: Postgres) => Promise<any>) => {
  const client = await getClient();

  try {
    await client.begin();
    const ret = await executeQuery(client);
    await client.commit();
    return ret
  } catch (e: any) {
    console.warn('transaction rollback. error ->', e);
    await client.rollback();
    throw e;
  } finally {
    // lambdaのライフサイクルより、コードのバックグラウンド処理はlambda終了までに終わらせる必要がある。
    // https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/runtimes-context.html
    // node-postgres でも [クライアントで実行したクエリにエラーがあったかどうかに関係なく、チェックアウトに成功した場合は、常にクライアントをプールに戻す必要があります。]といっている。
    // https://node-postgres.com/features/pooling
    await client.release();
  }
}