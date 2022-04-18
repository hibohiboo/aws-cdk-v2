#!/usr/bin/env node
import 'source-map-support/register';

import { App } from 'aws-cdk-lib';
import { config } from 'dotenv'
import { VpcRouteTestStack } from '../lib/vpc-route-test-stack';
config();
if (!process.env.SUBNET_GROUP_NAME) throw Error('please set environment variable SUBNET_GROUP_NAME')
if (!process.env.SSM_PARAM_KEY_SUBNET_IDS) throw Error('please set environment variable SSM_PARAM_KEY_SUBNET_IDS')
const app = new App();

new VpcRouteTestStack(app, 'VpcRouteTestStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});