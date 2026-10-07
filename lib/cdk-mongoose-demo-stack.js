const path = require('path');
const fs = require('fs');
const { Stack, Duration, CfnOutput } = require('aws-cdk-lib/core');
const lambda = require('aws-cdk-lib/aws-lambda');
const apigw = require('aws-cdk-lib/aws-apigateway');

class CdkMongooseDemoStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing. Add it to the .env file in the project root.');
    }

    // Settings shared by both Lambdas
    const commonProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      timeout: Duration.seconds(15),
      memorySize: 256,
      environment: { MONGODB_URI: mongoUri },
    };

    // Safety net: fail the deploy if mongoose was not installed for Lambda 1
    const withMongooseDir = path.join(__dirname, '../lambda/with-mongoose');
    if (!fs.existsSync(path.join(withMongooseDir, 'node_modules', 'mongoose'))) {
      throw new Error('mongoose is not installed. Run: npm ci --prefix lambda/with-mongoose');
    }

    // Lambda 1: zips lambda/with-mongoose -> index.js + node_modules/mongoose
    const withMongooseFn = new lambda.Function(this, 'WithMongooseFn', {
      ...commonProps,
      functionName: 'with-mongoose',
      code: lambda.Code.fromAsset(withMongooseDir),
    });

    // Lambda 2: zips lambda/without-mongoose -> index.js only
    const withoutMongooseFn = new lambda.Function(this, 'WithoutMongooseFn', {
      ...commonProps,
      functionName: 'without-mongoose',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/without-mongoose')),
    });

    // API Gateway so Postman can call both Lambdas
    const api = new apigw.RestApi(this, 'MongooseDemoApi', {
      restApiName: 'mongoose-demo-api',
      deployOptions: { stageName: 'dev' },
    });

    api.root
      .addResource('with-mongoose')
      .addMethod('POST', new apigw.LambdaIntegration(withMongooseFn));

    api.root
      .addResource('without-mongoose')
      .addMethod('POST', new apigw.LambdaIntegration(withoutMongooseFn));


    new CfnOutput(this, 'WithMongooseUrl', { value: `${api.url}with-mongoose` });
    new CfnOutput(this, 'WithoutMongooseUrl', { value: `${api.url}without-mongoose` });
  }
}

module.exports = { CdkMongooseDemoStack };