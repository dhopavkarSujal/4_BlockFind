import { createHash, randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import { recordAuditEvent } from './audit-log.service.js';

import prisma from '../db/prisma.js';
import {
  getEvidenceBucketName,
  getSupabaseStorage,
} from '../db/supabase-storage.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SIGNED_URL_SECONDS = 120;
const ACTIVE_CLAIM_STATUSES = new Set(['PENDING', 'IN_REVIEW']);

const ALLOWED_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const PUBLIC_EVIDENCE_SELECT = {
  id: true,
  claimId: true,
  uploadedById: true,
  originalFileName: true,
  mimeType: true,
  sizeBytes: true,
  sha256Hash: true,
  createdAt: true,
};

export class ClaimEvidenceServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ClaimEvidenceServiceError';
    this.statusCode = statusCode;
  }
}

function getStorageClient() {
  try {
    return getSupabaseStorage();
  } catch {
    throw new ClaimEvidenceServiceError(
      'Private evidence storage is not configured. Check the server storage environment variables.',
      503,
    );
  }
}

function sanitiseFileName(name) {
  const basename = String(name || 'evidence')
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, 255);

  return basename || 'evidence';
}

async function requireAccessibleClaim(claimId, requester, ownerOnly = false) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      claimantId: true,
      status: true,
    },
  });

  if (!claim) {
    throw new ClaimEvidenceServiceError('Claim not found', 404);
  }

  const isOwner = claim.claimantId === requester.id;
  const isStaff = ['VERIFIER', 'ADMIN'].includes(requester.role);

  if ((ownerOnly && !isOwner) || (!ownerOnly && !isOwner && !isStaff)) {
    // Do not disclose claims belonging to other users.
    throw new ClaimEvidenceServiceError('Claim not found', 404);
  }

  return claim;
}

function publicEvidence(record) {
  return {
    id: record.id,
    claimId: record.claimId,
    uploadedById: record.uploadedById,
    originalFileName: record.originalFileName,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    sha256Hash: record.sha256Hash,
    createdAt: record.createdAt,
  };
}

export async function uploadClaimEvidence(claimId, requester, file) {
  const claim = await requireAccessibleClaim(claimId, requester, true);

  if (!ACTIVE_CLAIM_STATUSES.has(claim.status)) {
    throw new ClaimEvidenceServiceError(
      'Evidence can only be added while a claim is pending or in review',
      409,
    );
  }

  if (!file?.buffer || !file.size) {
    throw new ClaimEvidenceServiceError('An evidence file is required', 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ClaimEvidenceServiceError(
      'Evidence files cannot exceed 5 MB',
      413,
    );
  }

  // Detect the actual file signature; do not trust the client MIME type.
  const detectedType = await fileTypeFromBuffer(file.buffer);
  const extension = detectedType
    ? ALLOWED_EXTENSIONS[detectedType.mime]
    : undefined;

  if (!detectedType || !extension) {
    throw new ClaimEvidenceServiceError(
      'Unsupported file. Upload a JPEG, PNG, WebP, or PDF file.',
      415,
    );
  }

  const storage = getStorageClient();
  const bucket = getEvidenceBucketName();
  const evidenceId = randomUUID();
  const storageKey = `${claimId}/${evidenceId}.${extension}`;
  const sha256Hash = createHash('sha256').update(file.buffer).digest('hex');
  const originalFileName = sanitiseFileName(file.originalname);

  const { error: uploadError } = await storage.storage
    .from(bucket)
    .upload(storageKey, file.buffer, {
      contentType: detectedType.mime,
      cacheControl: '0',
      upsert: false,
    });

  if (uploadError) {
    console.error('Private evidence storage upload failed:', uploadError);

    throw new ClaimEvidenceServiceError(
      'Evidence could not be stored. Check the private bucket configuration.',
      503,
    );
  }

  try {
    // Recheck the claim after the remote storage operation in case its status
    // changed during upload.
    const currentClaim = await prisma.claim.findUnique({
      where: { id: claimId },
      select: { claimantId: true, status: true },
    });

    if (!currentClaim || currentClaim.claimantId !== requester.id) {
      throw new ClaimEvidenceServiceError('Claim not found', 404);
    }

    if (!ACTIVE_CLAIM_STATUSES.has(currentClaim.status)) {
      throw new ClaimEvidenceServiceError(
        'The claim is no longer accepting evidence',
        409,
      );
    }

    const evidence = await prisma.$transaction(async (tx) => {
    const createdEvidence = await tx.claimEvidence.create({
      data: {
        id: evidenceId,
        claimId,
        uploadedById: requester.id,
        storageKey,
        originalFileName,
        mimeType: detectedType.mime,
        sizeBytes: file.size,
        sha256Hash,
      },
      select: PUBLIC_EVIDENCE_SELECT,
    });

    await recordAuditEvent(tx, {
      actorId: requester.id,
      action: 'CLAIM_EVIDENCE_UPLOADED',
      entityType: 'ClaimEvidence',
      entityId: createdEvidence.id,
      details: {
        claimId,
        mimeType: detectedType.mime,
        sizeBytes: file.size,
        sha256Hash,
      },
    });

    return createdEvidence;
  });

return evidence;
    return evidence;
  } catch (error) {
    // The database and object store do not share a transaction. Remove the
    // file if the metadata insert or final status check fails.
    const { error: cleanupError } = await storage.storage
      .from(bucket)
      .remove([storageKey]);

    if (cleanupError) {
      console.error(
        'Evidence cleanup failed after metadata insert error:',
        cleanupError,
      );
    }

    throw error;
  }
}

export async function listClaimEvidence(claimId, requester) {
  await requireAccessibleClaim(claimId, requester);

  const records = await prisma.claimEvidence.findMany({
    where: { claimId },
    select: PUBLIC_EVIDENCE_SELECT,
    orderBy: { createdAt: 'desc' },
  });

  return records;
}

export async function getClaimEvidenceDownloadUrl(
  claimId,
  evidenceId,
  requester,
) {
  await requireAccessibleClaim(claimId, requester);

  const evidence = await prisma.claimEvidence.findFirst({
    where: {
      id: evidenceId,
      claimId,
    },
  });

  if (!evidence) {
    throw new ClaimEvidenceServiceError('Evidence not found', 404);
  }

  const storage = getStorageClient();
  const bucket = getEvidenceBucketName();

  const { data, error } = await storage.storage
    .from(bucket)
    .createSignedUrl(evidence.storageKey, SIGNED_URL_SECONDS, {
      download: evidence.originalFileName,
    });

  if (error || !data?.signedUrl) {
    console.error('Evidence signed URL creation failed:', error);

    throw new ClaimEvidenceServiceError(
      'Could not create a temporary evidence download link',
      503,
    );
  }

  await recordAuditEvent(prisma, {
    actorId: requester.id,
    action: 'CLAIM_EVIDENCE_DOWNLOAD_LINK_CREATED',
    entityType: 'ClaimEvidence',
    entityId: evidence.id,
    details: {
      claimId,
      expiresInSeconds: SIGNED_URL_SECONDS,
    },
  });
  return {
    evidence: publicEvidence(evidence),
    signedUrl: data.signedUrl,
    expiresIn: SIGNED_URL_SECONDS,
  };
}
