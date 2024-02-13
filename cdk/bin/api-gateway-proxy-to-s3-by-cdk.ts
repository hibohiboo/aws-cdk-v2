#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { config } from 'dotenv';
import { ApiGatewayProxyToS3ByCdkStack } from '../lib/api-gateway-proxy-to-s3-by-cdk-stack';

config();
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

new ApiGatewayProxyToS3ByCdkStack(app, 'ApiGatewayProxyToS3ByCdkStack', { env, projectId: processEnv.PROJECT_ID });
