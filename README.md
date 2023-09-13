# An Example of moving file objects from AWS S3 to AWS EFS Using AWS Lambda

This example demonstrates how a file can be moved from a S3 bucket to an EFS using a lambda function.  This can be very useful if you have any background processes that get files from external systems and your application uses that filesystem to read files without making any additional changes to code.  Although applications will have to mount the EFS volume to read the files, it simplifies existing legacy applications that just need to read a file from FileSystem instead of using S3, S3 SDK, or APIs.  
This project is deployed using AWS CDK in TypeScript.

*Note: The example AWS Transfer Family application (https://github.com/smislam/aws-file-transfer) uses S3 as a destination for simplicity.  It can easily be converted to use EFS instead.  When using AWS Tranasfer Family, if the final destination is EFS, make appropriate changes to your infrastructure code.*

## What does it build?
* Creates a S3 Bucket for source files
* Creates an EFS for destination files
* Creates a Lambda function to move files between S3 and EFS
* Creates S3 event when a new file is created and automatically invoke a lambda that copies the file from S3 to EFS
* Creates an additional testing Lambda that reads file list from the EFS volume and Exposes using API Gateway


## Steps to run and test
* Deploy the CDK code. Wait for the deploy to finish.  It will print out the S3 Bucket name and the test API Endpoint.
* Upload a file to created S3 bucket from your local machine (you can use AWS Console as depicted here.  Alternatively, you can use AWS CLI)
  * ![image](s3-upload.PNG "Upload a file to S3")
* Click on the API Gateway endpoint to view the file name from EFS.
  * ![image](efs-list.PNG "View a list of the files in EFS")


## Next Steps
* Add virus scanning before the file is copied to EFS.  Refer to the ClamAV Rest API (https://github.com/smislam/clamav-rest-api) project.
* After a file is moved, do we need to remove it from S3 or send to archival?
* If a file is deleted from S3, what do we do?
* Should we send SNS message to support team when a new file is available or if there is a problem moving files?