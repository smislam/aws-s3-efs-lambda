import { Handler } from "aws-lambda";
import { readdirSync } from "fs";

export const handler: Handler = async (event, context) => {
    const efsPath = process.env.EFS_PATH!;    
    
    return {
        statusCode: 200,
        body: JSON.stringify(`Files (${efsPath}): ${readdirSync(efsPath)}`)
    };
};
