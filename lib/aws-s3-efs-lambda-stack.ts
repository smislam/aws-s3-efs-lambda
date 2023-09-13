import * as cdk from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { GatewayVpcEndpointAwsService, InterfaceVpcEndpointAwsService, Peer, Port, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AccessPoint, FileSystem } from 'aws-cdk-lib/aws-efs';
import { Runtime, Tracing, FileSystem as lfs } from 'aws-cdk-lib/aws-lambda';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Bucket, BucketEncryption, EventType } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import path = require('path');

export class AwsS3EfsLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'app-vpc', {});

    const vpce_sg = new SecurityGroup(this, 'vpc-sg', { vpc });
    vpce_sg.addIngressRule(Peer.ipv4(vpc.vpcCidrBlock), Port.tcp(443));

    vpc.addGatewayEndpoint('s3vpce', {
      service: GatewayVpcEndpointAwsService.S3 
    });

    vpc.addInterfaceEndpoint('efsvpce', {
      service: InterfaceVpcEndpointAwsService.ELASTIC_FILESYSTEM,
      securityGroups: [vpce_sg],
      privateDnsEnabled: true 
    });

    const sourceBucket = new Bucket(this, 'source-s3', {
      encryption: BucketEncryption.KMS,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const destFileSystem = new FileSystem(this, 'dest-efs', {
      vpc,
      encrypted: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const accessPoint = new AccessPoint(this, 'efs-access-point', {
      fileSystem: destFileSystem,
      path: '/efs/lambda',
      posixUser: { uid: '1001', gid: '1001' },
      createAcl: { ownerUid: '1001', ownerGid: '1001', permissions: '750' }
    });

    const lambdaLocalMountPath = '/mnt/files';
    const lambda = new NodejsFunction(this, 'file-transfer-lambda', {
      vpc,
      handler: 'handler',
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '/../lambda/file_transfer.ts'),
      environment: {
        EFS_PATH: lambdaLocalMountPath
      },
      filesystem: lfs.fromEfsAccessPoint(accessPoint, lambdaLocalMountPath),
      logRetention: RetentionDays.ONE_DAY,
      tracing: Tracing.ACTIVE
    });

    sourceBucket.grantRead(lambda);
    destFileSystem.connections.allowDefaultPortFrom(lambda);
    
    const s3Event = new S3EventSource(sourceBucket, { events: [EventType.OBJECT_CREATED] });
    lambda.addEventSource(s3Event);

    const tester_lambda = new NodejsFunction(this, 'test-file-lambda', {
      vpc,
      handler: 'handler',
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '/../lambda/file_transfer_test.ts'),
      environment: {
        EFS_PATH: lambdaLocalMountPath
      },
      filesystem: lfs.fromEfsAccessPoint(accessPoint, lambdaLocalMountPath),
      logRetention: RetentionDays.ONE_DAY,
      tracing: Tracing.ACTIVE
    });

    destFileSystem.connections.allowDefaultPortFrom(tester_lambda);

    const api = new LambdaRestApi(this, 'test-api', {
      handler: tester_lambda
    });

    new cdk.CfnOutput(this, 's3-bucket-name', {
      value: sourceBucket.bucketName,
      exportName: `${props?.stackName}-bucketName`
    });

  }
}
