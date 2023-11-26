#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PythonDockerLambdaS3Stack } from '../lib/python-docker-lambda-s3-stack';

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};
const app = new cdk.App();
new PythonDockerLambdaS3Stack(app, 'PythonDockerLambdaS3Stack', {
  env,
});
