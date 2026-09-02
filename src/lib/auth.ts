import { cookies } from 'next/headers';
import crypto from 'crypto';
import type { AccountRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const ADMIN_SESSION_COOKIE = process.env.ADMIN_SESSION_COOKIE || 'webstore_admin_session';
const ADMIN_SESSION_TTL_SECONDS = 24 * 60 * 60;

function adminSessionSecret(): string {
  const configured = process.env.ADMIN_JWT_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_JWT_SECRET wajib dikonfigurasi di production.');
  }
  return 'local-admin-session-secret-change-before-production';
}

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: AccountRole;
}

export function createSessionToken(admin: AdminSession): string {
  const payload = Buffer.from(JSON.stringify({ ...admin, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', adminSessionSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): AdminSession | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', adminSessionSecret()).update(payload).digest('base64url');
    const actual = Buffer.from(signature, 'base64url');
    const expected = Buffer.from(expectedSig, 'base64url');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (Date.now() > decoded.exp) return null;

    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPERADMIN') return null;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const decoded = verifySessionToken(token);
  if (!decoded) return null;

  const admin = await db.adminUser.findFirst({
    where: {
      id: decoded.id,
      status: 'ACTIVE',
      account: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
    },
    include: { account: { select: { role: true } } },
  });
  if (!admin?.account) return null;

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.account.role,
  };
}

export function setAdminSessionCookie(response: NextResponse, admin: AdminSession): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, createSessionToken(admin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
