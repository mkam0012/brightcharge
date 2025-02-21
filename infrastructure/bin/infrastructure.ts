#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new cdk.App();

// Get AWS account from environment or use a default for development
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || '123456789012'; // Default account for development

// Development stack
new InfrastructureStack(app, 'BrightChargeDev', {
  environment: 'development',
  env: {
    account,
    region: 'us-east-1', // Required for ACM certificates used with CloudFront
  },
});

// Production stack - only deploy if we have a real account ID
if (process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID) {
  new InfrastructureStack(app, 'BrightChargeProd', {
    environment: 'production',
    env: {
      account,
      region: 'us-east-1', // Required for ACM certificates used with CloudFront
    },
  });
}

app.synth();