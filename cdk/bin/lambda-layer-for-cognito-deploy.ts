#!/usr/bin/env node
import 'source-map-support/register';
import * as dotenv from 'dotenv'
import * as cdk from 'aws-cdk-lib';
import { LambdaLayersForCognitoStack } from '../lib/lambda-layers-for-cognito-stack';

// lambada leyerの作成。。
// lambdaWithCognitoで使用するlayer versionを作成


dotenv.config()
const envList = [
  'SSM_PARAM_KEY_UTIL_LAYER_VERSIONS_ARN',
  'SSM_PARAM_KEY_VERIFY_LAYER_VERSIONS_ARN'
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

new LambdaLayersForCognitoStack(app, 'LambdaLayersForCognitoStack', {
  utilSSMKey: processEnv.SSM_PARAM_KEY_UTIL_LAYER_VERSIONS_ARN,
  verifySSMKey: processEnv.SSM_PARAM_KEY_VERIFY_LAYER_VERSIONS_ARN,
  env,
});
