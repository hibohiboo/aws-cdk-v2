#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { config } from 'dotenv'
import { BastionStack } from '../lib/bastion-stack';

config();

const envList = ['VPC_ID', 'PUBLIC_SG_ID', 'DB_SECRET_NAME', 'PUBLIC_SUBNET_ID'] as const;
envList.forEach(k => { if (!process.env[k]) throw new Error(`please set environment variable  ${k}`) });
const processEnv = process.env as Record<typeof envList[number], string>;

const app = new App();

new BastionStack(app, 'BastionStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcId: processEnv.VPC_ID,
  sgId: processEnv.PUBLIC_SG_ID,
  dbSecretName: processEnv.DB_SECRET_NAME,
  publicSubnetId: processEnv.PUBLIC_SUBNET_ID
});