#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PrivateLambdaStack } from '../lib/private-lambda-stack';
import { config } from 'dotenv'
config();
if (!process.env.VPC_ID) throw Error('please set environment variable VPC_ID')
if (!process.env.PRIVATE_SG_ID) throw Error('please set environment variable PRIVATE_SG_ID')
if (!process.env.SUBNET_GROUP_NAME) throw Error('please set environment variable SUBNET_GROUP_NAME')
if (!process.env.DB_SECRET_NAME) throw Error('please set environment variable DB_SECRET_NAME')


const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
}
new PrivateLambdaStack(app, 'PrivateLambdaStack', {
  env,
  vpcId: process.env.VPC_ID,
  sgId: process.env.PRIVATE_SG_ID,
  subnetGroupName: process.env.SUBNET_GROUP_NAME,
  dbSecretName: process.env.DB_SECRET_NAME,
});
