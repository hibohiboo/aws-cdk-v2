#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { config } from 'dotenv'
import { CdkV2LogRetentionStack } from '../lib/log-retention-stack';
import { LogS3FireHoseStack } from '../lib/log-s3-firehose';

config()
const envList = ['LOG_BACKUP_BUCKET_NAME'] as const
for (const key of envList) {
  if (!process.env[key]) throw new Error(`please add ${key} to .env`)
}
const processEnv = process.env as Record<typeof envList[number], string>
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
}

const app = new cdk.App();
new LogS3FireHoseStack(app, 'LogS3FireHoseStack', { env, bucketName: processEnv.LOG_BACKUP_BUCKET_NAME })
// new CdkV2LogRetentionStack(app, 'CdkV2LogRetentionStack', {
//   env
// });
