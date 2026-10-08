#!/usr/bin/env node
const cdk = require('aws-cdk-lib/core');
const { CdkMongooseDemoStack } = require('../lib/cdk-mongoose-demo-stack');

const app = new cdk.App();
const stack = new CdkMongooseDemoStack(app, 'CdkMongooseDemoStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-south-1' },
});

// Security checks (cdk-nag). Only runs with: npx cdk synth -c nag=true
if (app.node.tryGetContext('nag') === 'true') {
  const { AwsSolutionsChecks } = require('cdk-nag');
  cdk.Validations.of(app).addPlugins(new AwsSolutionsChecks(app, { verbose: true }));

  // Findings we accept for this training demo. Each one needs a reason.
  const accepted = [
    {
      id: 'AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole]',
      reason: 'AWS managed policy only lets the Lambdas write their own CloudWatch logs.'
    },
    { id: 'AwsSolutions-L1', reason: 'Runtimes are pinned on purpose (Node.js 22 LTS); upgrades are done deliberately.' },
    { id: 'AwsSolutions-APIG1', reason: 'Training demo: API access logging not needed.' },
    { id: 'AwsSolutions-APIG2', reason: 'Request bodies are validated inside the Lambda (mongoose schema).' },
    { id: 'AwsSolutions-APIG3', reason: 'Training demo: WAF is a paid service and not needed.' },
    { id: 'AwsSolutions-APIG4', reason: 'Training demo: API is intentionally public. Real apps need an authorizer.' },
    { id: 'AwsSolutions-APIG6', reason: 'Training demo: stage-level CloudWatch logging not needed.' },
    { id: 'AwsSolutions-COG4', reason: 'Training demo: no Cognito user pool. Real apps should use one.' },
  ];
  accepted.forEach((rule) => cdk.Validations.of(stack).acknowledge(rule));
}