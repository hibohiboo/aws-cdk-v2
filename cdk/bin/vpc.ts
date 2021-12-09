#!/usr/bin/env node
import 'source-map-support/register';
import { VpcStack } from '../lib/vpc-stack';
import { App } from 'aws-cdk-lib';
import { config } from 'dotenv'
config();
if (!process.env.SUBNET_GROUP_NAME) throw Error('please set environment variable SUBNET_GROUP_NAME')

const app = new App();

new VpcStack(app, 'VpcStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  subnetGroupName: process.env.SUBNET_GROUP_NAME,
});