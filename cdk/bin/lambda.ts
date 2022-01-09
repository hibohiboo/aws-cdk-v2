#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PrivateLambdaStack } from '../lib/private-lambda-stack';
import { config } from 'dotenv'
config();

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
}

const envNames = ['VPC_ID', 'PRIVATE_LAMBDA_SG_ID', 'DB_USER_RESOURCE_ARN', 'DB_ADMIN_NAME', 'DB_PROXY_ENDPOINT', 'DB_USER_NAME'] as const
const checkEnvs = (e: any): e is Record<(typeof envNames)[number], string> => {
  for (const a of envNames) {
    if (!e[a]) throw new Error(`please set environment variable ${a}`)
  }
  return true
}
if (!checkEnvs(process.env)) throw new Error('到達しない')

new PrivateLambdaStack(app, 'PrivateLambdaStack', {
  env,
  vpcId: process.env.VPC_ID,
  sgId: process.env.PRIVATE_LAMBDA_SG_ID,
  rdsProxyArn: process.env.DB_USER_RESOURCE_ARN,
  dbAdminName: process.env.DB_ADMIN_NAME,
  dbProxyEndpont: process.env.DB_PROXY_ENDPOINT,
  dbReadOnlyUserName: process.env.DB_USER_NAME
});


