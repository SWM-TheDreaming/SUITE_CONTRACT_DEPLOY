import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

export const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY, // Add your AWS access key
  secretAccessKey: process.env.AWS_SECRET_KEY, // Add your AWS secret key
  region: process.env.AWS_REGION, // Add your AWS region
});
