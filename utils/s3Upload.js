const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require('../config/aws');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

/**
 * Uploads a file buffer to AWS S3.
 * @param {Buffer} fileBuffer - The file buffer.
 * @param {string} fileName - The name of the file.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<string>} - The URL of the uploaded file.
 */
const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  return `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/${fileName}`;
};

/**
 * Gets a file from AWS S3.
 * @param {string} fileName - The name of the file.
 * @returns {Promise<string>} - The URL of the file.
 */
const getFromS3 = async (fileName) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileName,
  };
  const command = new GetObjectCommand(params);
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
};

/**
 * Deletes a file from AWS S3.
 * @param {string} fileName - The name of the file.
 */
const deleteFromS3 = async (fileName) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileName,
  };
  const command = new DeleteObjectCommand(params);
  await s3Client.send(command);
  return true;
};

module.exports = { uploadToS3, getFromS3, deleteFromS3 };