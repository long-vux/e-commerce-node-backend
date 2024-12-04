const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require('../config/aws');

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

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

module.exports = uploadToS3;