

import { App } from 'aws-cdk-lib';
import { config } from 'dotenv';
import { AlarmSNSStack } from '../lib/alarm-sns-stack';
config();
const envList = ['EMAIL_ADRESS'] as const;
envList.forEach(k => { if (!process.env[k]) throw new Error(`${k} environment required`) });
const processEnv = process.env as Record<typeof envList[number], string>;
const app = new App();

new AlarmSNSStack(app, 'AlarmSNSStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  emailAdress: processEnv.EMAIL_ADRESS
});