import 'source-map-support/register';

import { App } from 'aws-cdk-lib';
import { AuroraStack } from '../lib/aurora-stack';
import { config } from 'dotenv';

config();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
}

const envNames = ['VPC_ID', 'PRIVATE_SG_ID', 'SUBNET_GROUP_NAME', 'DB_SECRET_NAME', 'DB_ADMIN_NAME', 'DB_USER_SECRET_NAME', 'DB_USER_NAME', 'SSM_PARAM_KEY_SUBNET_IDS'] as const
const checkEnvs = (e: any): e is Record<(typeof envNames)[number], string> => {
  for (const a of envNames) {
    if (!e[a]) throw new Error(`please set environment variable ${a}`)
  }
  return true
}
if (!checkEnvs(process.env)) throw new Error('到達しない')

const app = new App();

new AuroraStack(app, 'AuroraStack', {
  env,
  vpcId: process.env.VPC_ID,
  sgId: process.env.PRIVATE_SG_ID,
  subnetGroupName: process.env.SUBNET_GROUP_NAME,
  dbAdminSecretName: process.env.DB_SECRET_NAME,
  dbAdminName: process.env.DB_ADMIN_NAME,
  dbReadOnlyUserSecretName: process.env.DB_USER_SECRET_NAME,
  dbReadOnlyUserName: process.env.DB_USER_NAME,
  ssmParamKeySubnetIds: process.env.SSM_PARAM_KEY_SUBNET_IDS
});