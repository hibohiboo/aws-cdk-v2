#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PythonDockerLambdaEchoStack } from '../lib/python-docker-lambda-echo-stack';

const app = new cdk.App();
new PythonDockerLambdaEchoStack(app, 'PythonDockerLambdaEchoStack', {});
