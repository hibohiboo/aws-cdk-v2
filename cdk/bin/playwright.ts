import { App } from 'aws-cdk-lib';
import { PlayWrightStack } from '../lib/playwright-stack';
const app = new App();
new PlayWrightStack(app, 'PlayWrightStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
