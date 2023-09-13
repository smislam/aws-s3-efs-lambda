import { Context, Handler, S3Event } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { writeFileSync } from "fs";
import path = require("path");

export const handler: Handler = async (event: S3Event, context: Context ): Promise<any> => {
    const efsPath = process.env.EFS_PATH!;
    const s3_client = new S3Client({ region: process.env.AWS_REGION });
    await new Promise(function (resolve, reject) {
        event.Records.forEach(async (record) => {
            const key = record.s3.object.key.replace(/\+/g, ' ');
            const bucketName = record.s3.bucket.name;

            try {
                const response = await s3_client.send(new GetObjectCommand({Bucket: bucketName, Key: key}));
                if (response.Body != undefined) {
                    const bytes = await response.Body.transformToByteArray();
                    writeFileSync(path.join(efsPath, key), bytes);
                    console.log(`Copied file...${efsPath}/${key}`);
                } else {
                    console.log(`Response Body is empty`);
                }
            } catch (err) {
                console.error(err);
            }
        });
    });
};