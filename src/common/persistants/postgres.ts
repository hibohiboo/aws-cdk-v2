import { Pool } from 'pg';
import { RDS, SecretsManager } from 'aws-sdk'
import * as fs from 'fs'
import type { PoolClient } from 'pg';

const RETRY_COUNT = 5;
const RETRY_INTERVAL_MILLI_SECOND = 1000; // 1秒
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

  // 読取専用エンドポイントの場合は verify-ca で接続(ホストのドメインに.endpointが含まれるため証明書のコモンネームと不一致となるため検証スキップ)
  const ssl = process.env.IS_READ_ONLY ? {
    ca: fs.readFileSync('/opt/nodejs/data/AmazonRootCA1.pem'),
    requestCert: true,
    rejectUnauthorized: false
  } : { ca: fs.readFileSync('/opt/nodejs/data/AmazonRootCA1.pem') };

  return new Pool({
    host: signerOptions.hostname,
    port: signerOptions.port,
    user: signerOptions.username,
    database: DB_DBNAME,
    // IAM認証のため、パスワードの代わりにトークンを使用する。
    password: () => signer.getAuthToken(signerOptions),
    ssl
  });
}

/**
 * Postgresのインスタンスを返却
 * @return {Promise<Postgres>}
 */
const getClient = async () => {
  if (!pool) pool = getPool();
  const postgres = new Postgres();

  for (let i = 0; i < RETRY_COUNT; i++) {
    try {
      await postgres.init();
      return postgres;
    } catch (e) {
      // タイムアウト
      // セキュリティグループのインバウンドルールが設定されていない。RDS Proxyとプロキシエンドポイントはそれぞれセキュリティグループの設定があるので注意

      // RDS ProxyのIAM認証がtrueになっていると、The IAM authentication failed for the role ロール名. Check the IAM token for this role and try again.のエラーが発生することがある
      // 原因1: lambdaのPolicyStatement不足(rds-connect)
      // 原因2: lambdaのPolicyStatementに指定したユーザ名と接続しようとしているユーザ名が異なる
      // 原因3: lambdaのPolicyStatementの文字列が間違っている。(arn:aws:rds-db:ap-northeast-1:)のところを(arn:aws:rds:ap-northeast-1:)としているなど

      // This RDS proxy has no credentials for the role ユーザ名. Check the credentials for this role and try again
      // 原因: ＣＤＫの、new DatabaseProxy(this, 'Proxy', { secrets: [],...)のsecretsの配列に使用したいユーザ・パスワードが入っていない。

      // permission denied for table electric
      // 原因: 使用しているユーザに該当するテーブルへの操作権限がない（insertなど）

      // The password that was provided for the role ロール名 is wrong
      // 原因: IAM認証を使用していないのにgetAuthTokenを使って接続しようとしている。IAM認証を使わない場合は、passwordにはパスワードの文字列が必要

      // [ERR_TLS_CERT_ALTNAME_INVALID]: Hostname/IP does not match certificate's altnames: Host: readOnlyProxyEndpoint.endpoint.proxy-xxx.ap-northeast-1.rds.amazonaws.com. is not in the cert's altnames: DNS:*.proxy-xxx.ap-northeast-1.rds.amazonaws.com
      // 原因: 読取専用エンドポイント

      // cannot execute INSERT in a read-only transaction
      // 原因: 読取専用エンドポイントでinsert

      console.warn(`error try ${i}`, e);
      // pool = null; // テスト用。 getPool()で失敗する接続文字列でもインスタンスは返却される。
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MILLI_SECOND)); // 1秒待つ
    }
  }
  throw new Error('connect failed')
};

export const getPostgresClient = getClient;