#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new cdk.App();

new InfrastructureStack(app, 'BrightChargeDev', {
  environment: 'development',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-southeast-2',
  },
});

new InfrastructureStack(app, 'BrightChargeProd', {
  environment: 'production',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-southeast-2',
  },
});