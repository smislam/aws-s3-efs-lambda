#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsS3EfsLambdaStack } from '../lib/aws-s3-efs-lambda-stack';

const app = new cdk.App();
new AwsS3EfsLambdaStack(app, 'AwsS3EfsLambdaStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});