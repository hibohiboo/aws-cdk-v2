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


new StepFunctionSampleStack(app, 'StepFunctionSampleStack', { env });


