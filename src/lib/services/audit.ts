import { db } from '@/lib/db';

export interface RecordAuditOptions {
  actorId?: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Record an append-only audit log entry
 */
export async function recordAuditLog({
  actorId,
  actorEmail,
  action,
  entity,
  entityId,
  details,
  ipAddress,
}: RecordAuditOptions) {
  try {
    return await db.auditLog.create({
      data: {
        actorId,
        actorEmail,
        action,
        entity,
        entityId,
        detailsJson: details ? JSON.stringify(details) : null,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed creating audit log entry:', err);
  }
}
