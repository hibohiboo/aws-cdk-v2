#!/usr/bin/env node
import 'source-map-support/register';
import { VpcStack } from '../lib/vpc-stack';
import { App } from 'aws-cdk-lib';

const app = new App();

new VpcStack(app, 'VpcStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});