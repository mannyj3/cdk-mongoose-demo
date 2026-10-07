#!/usr/bin/env node
const cdk = require('aws-cdk-lib/core');
const { CdkMongooseDemoStack } = require('../lib/cdk-mongoose-demo-stack');

const app = new cdk.App();
new CdkMongooseDemoStack(app, 'CdkMongooseDemoStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-south-1' },
});