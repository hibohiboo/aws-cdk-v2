#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { config } from 'dotenv'
import { StepFunctionSampleStack } from '../lib/step-functions-stack';
config();

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
}

const envNames = ['VPC_ID', 'PRIVATE_LAMBDA_SG_ID', 'DB_PROXY_RESOURCE_ID', 'DB_ADMIN_NAME', 'DB_PROXY_ENDPOINT', 'DB_USER_NAME', 'DB_PROXY_READ_ONLY_ENDPOINT'] as const
const checkEnvs = (e: any): e is Record<(typeof envNames)[number], string> => {
  for (const a of envNames) {
    console.log(a, e[a]);
    if (!e[a]) throw new Error(`please set environment variable ${a}`)
  }
  return true
}
if (!checkEnvs(process.env)) throw new Error('到達しない')

new StepFunctionSampleStack(app, 'StepFunctionSampleStack', {
  env,
  vpcId: process.env.VPC_ID,
  sgId: process.env.PRIVATE_LAMBDA_SG_ID,
  rdsProxyResourceId: process.env.DB_PROXY_RESOURCE_ID,
  dbAdminName: process.env.DB_ADMIN_NAME,
  dbProxyEndpoint: process.env.DB_PROXY_ENDPOINT,
  dbReadOnlyUserName: process.env.DB_USER_NAME,
  dbProxyReadOnlyEndpoint: process.env.DB_PROXY_READ_ONLY_ENDPOINT
});


