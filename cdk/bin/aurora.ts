import 'source-map-support/register';

import { App } from 'aws-cdk-lib';
import { AuroraStack } from '../lib/aurora-stack';
import { config } from 'dotenv'
config();
if (!process.env.VPC_ID) throw Error('please set environment variable VPC_ID')
if (!process.env.SG_ID) throw Error('please set environment variable SG_ID')
if (!process.env.SUBNET_GROUP_NAME) throw Error('please set environment variable SUBNET_GROUP_NAME')
if (!process.env.DB_SECRET_NAME) throw Error('please set environment variable DB_SECRET_NAME')
if (!process.env.DB_ADMIN_NAME) throw Error('please set environment variable DB_ADMIN_NAME')
if (!process.env.DB_USER_PASSWORD) throw Error('please set environment variable DB_USER_PASSWORD')

const app = new App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
}
new AuroraStack(app, 'AuroraStack', {
  env,
  vpcId: process.env.VPC_ID,
  sgId: process.env.SG_ID,
  subnetGroupName: process.env.SUBNET_GROUP_NAME,
  dbSecretName: process.env.DB_SECRET_NAME,
  dbAdminName: process.env.DB_ADMIN_NAME,
  dbUserPassword: process.env.DB_USER_PASSWORD
});