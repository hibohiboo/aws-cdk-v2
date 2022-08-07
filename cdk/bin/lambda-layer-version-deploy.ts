#!/usr/bin/env node
import 'source-map-support/register';
import * as dotenv from 'dotenv'
import * as cdk from 'aws-cdk-lib';
import { LambdaLayersStack } from '../lib/lambda-layers-stack';

// lambada leyerの作成。。
// lambdaWithCognitoで使用するlayer versionを作成


dotenv.config()
const envList = [
  'SSM_PARAM_KEY_LAYER_VERSIONS_ARN'
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

new LambdaLayersStack(app, 'LambdaLayersStack', {
  ssmKey: processEnv.SSM_PARAM_KEY_LAYER_VERSIONS_ARN,
  env,
});
