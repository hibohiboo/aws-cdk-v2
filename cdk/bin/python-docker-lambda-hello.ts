#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PythonDockerLambdaHelloStack } from '../lib/python-docker-lambda-hello-stack';

const app = new cdk.App();
new PythonDockerLambdaHelloStack(app, 'PythonDockerLambdaHelloStack', {});
