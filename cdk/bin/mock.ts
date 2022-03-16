#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MockApiGWStack } from '../lib/mock-api';

const app = new cdk.App();
new MockApiGWStack(app, 'MockApiGWStack', {});
