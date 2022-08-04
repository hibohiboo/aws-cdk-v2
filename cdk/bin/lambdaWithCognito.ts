#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { LambdaWithCognitoStack } from '../lib/LambdaWithCognitoStack'
import * as dotenv from 'dotenv'

dotenv.config()
const envList = [
  'PROJECT_ID',
  'DOMAIN_PREFIX',
  'CALLBACK_URLS',
  'LOGOUT_URLS',
  'FRONTEND_URLS',
] as const
for (const key of envList) {
  if (!process.env[key]) throw new Error(`please add ${key} to .env`)
}
const processEnv = process.env as Record<typeof envList[number], string>

const app = new cdk.App()
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
}
const projectId = processEnv.PROJECT_ID

new LambdaWithCognitoStack(app, `${projectId}-lambda-with-cognito-stack`, {
  projectId,
  domainPrefix: processEnv.DOMAIN_PREFIX,
  callbackUrls: processEnv.CALLBACK_URLS.split(','),
  logoutUrls: processEnv.LOGOUT_URLS.split(','),
  frontendUrls: processEnv.FRONTEND_URLS.split(','),
  env
})
