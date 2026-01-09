#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MiniatureTrackerStack } from '../lib/miniature-tracker-stack';

const app = new cdk.App();

// Get environment configuration
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';
const environment = process.env.ENVIRONMENT || 'dev';

new MiniatureTrackerStack(app, `MiniatureTracker-${environment}`, {
  env: {
    account,
    region,
  },
  environment,
  tags: {
    Project: 'MiniatureTracker',
    Environment: environment,
    ManagedBy: 'CDK',
  },
});