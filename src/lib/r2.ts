/**
 * Foto produk disimpan di Cloudflare R2 (API S3-compatible).
 *
 * Unggahan tidak melewati fungsi Vercel: server hanya menandatangani URL PUT
 * berumur pendek, browser mengirim berkasnya langsung ke R2. Body request
 * Vercel dibatasi 4,5 MB, jadi jalur langsung menghindari batas itu.
 * Kunci objek memakai UUID supaya nama berkas dari ponsel tidak pernah dipakai.
 */
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const UPLOAD_URL_TTL_SECONDS = 300;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

/** Membaca env setiap kali dipanggil supaya skrip dan server memakai nilai terbaru. */
export function r2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) return null;

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ""),
  };
}

export function isR2Configured(): boolean {
  return r2Config() !== null;
}

let cachedClient: { accountId: string; client: S3Client } | null = null;

function s3(config: R2Config): S3Client {
  if (cachedClient?.accountId === config.accountId) return cachedClient.client;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  cachedClient = { accountId: config.accountId, client };
  return client;
}

export function imageExtension(contentType: string): string | null {
  return IMAGE_EXTENSIONS[contentType] ?? null;
}

export function r2PublicUrl(config: R2Config, key: string): string {
  return `${config.publicBaseUrl}/${key}`;
}

/** Mengembalikan kunci objek bila URL memang milik bucket ini. */
export function r2KeyFromUrl(url: string): string | null {
  const config = r2Config();
  if (!config) return null;

  const prefix = `${config.publicBaseUrl}/`;
  if (!url.startsWith(prefix)) return null;

  const key = url.slice(prefix.length).split("?")[0];
  return key ? decodeURIComponent(key) : null;
}

export type PresignedUpload =
  | {
      ok: true;
      uploadUrl: string;
      publicUrl: string;
      key: string;
      expiresIn: number;
      maxBytes: number;
    }
  | { ok: false; message: string };

export async function presignImageUpload(input: {
  productId: string;
  contentType: string;
  size: number;
}): Promise<PresignedUpload> {
  const config = r2Config();
  if (!config) {
    return { ok: false, message: "Penyimpanan foto belum dikonfigurasi." };
  }

  const extension = imageExtension(input.contentType);
  if (!extension) {
    return { ok: false, message: "Format foto harus JPG, PNG, atau WebP." };
  }

  if (!Number.isInteger(input.size) || input.size < 1) {
    return { ok: false, message: "Berkas foto kosong." };
  }

  if (input.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "Ukuran foto melebihi 10 MB." };
  }

  const key = `products/${input.productId}/${crypto.randomUUID()}.${extension}`;

  const uploadUrl = await getSignedUrl(
    s3(config),
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: input.contentType,
    }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  );

  return {
    ok: true,
    uploadUrl,
    publicUrl: r2PublicUrl(config, key),
    key,
    expiresIn: UPLOAD_URL_TTL_SECONDS,
    maxBytes: MAX_UPLOAD_BYTES,
  };
}

/** Dipakai skrip pemindahan foto lama. Melempar galat supaya skrip berhenti jelas. */
export async function putR2Object(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<string> {
  const config = r2Config();
  if (!config) throw new Error("R2 belum dikonfigurasi.");

  await s3(config).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return r2PublicUrl(config, key);
}

/**
 * Menghapus objek dari R2. Kegagalan di sini tidak boleh menggagalkan
 * perubahan database, jadi hasilnya dikembalikan sebagai boolean.
 */
export async function deleteR2Object(key: string): Promise<boolean> {
  const config = r2Config();
  if (!config) return false;

  try {
    await s3(config).send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );
    return true;
  } catch (error) {
    console.error("hapus objek R2 gagal", key, error instanceof Error ? error.message : error);
    return false;
  }
}
