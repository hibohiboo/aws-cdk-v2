#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { config } from 'dotenv'
import { BastionStack } from '../lib/bastion-stack';
config();
if (!process.env.VPC_ID) throw Error('please set environment variable VPC_ID')
if (!process.env.PUBLIC_SG_ID) throw Error('please set environment variable PUBLIC_SG_ID')
if (!process.env.DB_SECRET_NAME) throw Error('please set environment variable DB_SECRET_NAME')
if (!process.env.PUBLIC_SUBNET_ID) throw Error('please set environment variable PUBLIC_SUBNET_ID')


const app = new App();

new BastionStack(app, 'BastionStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  vpcId: process.env.VPC_ID,
  sgId: process.env.PUBLIC_SG_ID,
  dbSecretName: process.env.DB_SECRET_NAME,
  publicSubnetId: process.env.PUBLIC_SUBNET_ID
});