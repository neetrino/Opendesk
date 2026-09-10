import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  ATTACHMENT_DOWNLOAD_URL_TTL_SECONDS,
  ATTACHMENT_UPLOAD_URL_TTL_SECONDS,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/constants";
import type { AttachmentContentType } from "@/lib/attachments";
import { isAllowedContentType } from "@/lib/attachments";
import { logger } from "@/lib/logger";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

let cachedClient: S3Client | null = null;
let cachedConfig: R2Config | null = null;

function readR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim() ?? "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() ?? "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() ?? "";
  const bucket = process.env.R2_BUCKET_NAME?.trim() ?? "";

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucket };
}

export function isR2Configured(): boolean {
  return readR2Config() !== null;
}

function requireR2Config(): R2Config {
  const config = readR2Config();
  if (!config) {
    throw new Error("R2_NOT_CONFIGURED");
  }
  return config;
}

function getR2Client(): S3Client {
  const config = requireR2Config();
  if (
    cachedClient &&
    cachedConfig &&
    cachedConfig.accountId === config.accountId &&
    cachedConfig.accessKeyId === config.accessKeyId &&
    cachedConfig.secretAccessKey === config.secretAccessKey &&
    cachedConfig.bucket === config.bucket
  ) {
    return cachedClient;
  }

  cachedConfig = config;
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return cachedClient;
}

function bucketName(): string {
  return requireR2Config().bucket;
}

export async function createAttachmentUploadUrl(
  objectKey: string,
  contentType: AttachmentContentType,
): Promise<string> {
  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: bucketName(),
      Key: objectKey,
      ContentType: contentType,
    }),
    { expiresIn: ATTACHMENT_UPLOAD_URL_TTL_SECONDS },
  );
}

export async function createAttachmentDownloadUrl(
  objectKey: string,
  filename: string,
  contentType: string,
): Promise<string> {
  const safeName = filename.replace(/[\r\n"]/g, "_");
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: bucketName(),
      Key: objectKey,
      ResponseContentType: contentType,
      ResponseContentDisposition: `inline; filename="${safeName}"`,
    }),
    { expiresIn: ATTACHMENT_DOWNLOAD_URL_TTL_SECONDS },
  );
}

export async function assertUploadedObject(
  objectKey: string,
  expectedContentType: AttachmentContentType,
): Promise<{ byteSize: number; contentType: string }> {
  const head = await getR2Client().send(
    new HeadObjectCommand({
      Bucket: bucketName(),
      Key: objectKey,
    }),
  );

  const byteSize = head.ContentLength ?? 0;
  const contentType =
    head.ContentType?.split(";")[0]?.trim().toLowerCase() ?? "";

  if (byteSize <= 0 || byteSize > MAX_ATTACHMENT_BYTES) {
    await deleteStoredObject(objectKey);
    throw new Error("FILE_TOO_LARGE");
  }

  if (contentType !== expectedContentType || !isAllowedContentType(contentType)) {
    await deleteStoredObject(objectKey);
    throw new Error("FILE_TYPE");
  }

  return { byteSize, contentType };
}

export async function deleteStoredObject(objectKey: string): Promise<void> {
  try {
    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: bucketName(),
        Key: objectKey,
      }),
    );
  } catch (error) {
    logger.warn("R2 delete failed", { objectKey, error });
  }
}
