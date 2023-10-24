#!/usr/bin/env node

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { S3FilterStack } from '../lib/s3-filter-stack';

dotenv.config();

const envList = ['PROJECT_ID'] as const;
for (const key of envList) {
  if (!process.env[key]) throw new Error(`please add ${key} to .env`);
}
const processEnv = process.env as Record<(typeof envList)[number], string>;

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};
const stackId = `${processEnv.PROJECT_ID}-s3-filter`;
new S3FilterStack(app, 'S3FilterStack', {
  bucketName: `${stackId}-bucket`,
  topicName: `${stackId}-topic`,
  projectNameTag: stackId,
  env,
});
