#!/usr/bin/env node
import 'source-map-support/register';
import * as dotenv from 'dotenv'
import * as cdk from 'aws-cdk-lib';
import { AWSCloudFrontClientDeployStack } from '../lib/client-deploy-stack';

dotenv.config()
const envList = [
  'PROJECT_ID',
  'TAG_PROJECT_NAME',
  'DISTRIBUTION_ID'
] as const
for (const key of envList) {
  if (!process.env[key]) throw new Error(`please add ${key} to .env`)
}
const processEnv = process.env as Record<typeof envList[number], string>

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
}
const projectId = processEnv.PROJECT_ID
const bucketName = `${projectId}-s3-bucket`

new AWSCloudFrontClientDeployStack(app, 'AWSCloudFrontClientDeployStack', {
  bucketName,
  projectId: processEnv.PROJECT_ID,
  distributionId: processEnv.DISTRIBUTION_ID,
  projectNameTag: processEnv.TAG_PROJECT_NAME,
  env,
});
