import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const CUSTOMER_SESSION_COOKIE = process.env.CUSTOMER_SESSION_COOKIE || 'digital_atelier_customer';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sessionSecret(): string {
  const configured = process.env.CUSTOMER_SESSION_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CUSTOMER_SESSION_SECRET wajib dikonfigurasi di production.');
  }
  return 'local-customer-session-secret-change-before-production';
}

interface CustomerSessionPayload {
  customerAccessId: string;
  exp: number;
  v: 1;
}

export interface CustomerSession {
  id: string;
  emailNormalized: string;
  displayName: string;
  whatsapp: string | null;
  accountId: string | null;
  isRegistered: boolean;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

export function createCustomerSessionToken(customerAccessId: string): string {
  const data: CustomerSessionPayload = {
    customerAccessId,
    exp: Date.now() + SESSION_TTL_MS,
    v: 1,
  };
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyCustomerSessionToken(token: string): CustomerSessionPayload | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const actual = Buffer.from(signature, 'base64url');
    const expected = Buffer.from(sign(payload), 'base64url');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as CustomerSessionPayload;
    if (decoded.v !== 1 || !decoded.customerAccessId || decoded.exp <= Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyCustomerSessionToken(token);
  if (!payload) return null;

  const access = await db.customerAccess.findUnique({
    where: { id: payload.customerAccessId },
    select: {
      id: true,
      emailNormalized: true,
      displayName: true,
      whatsapp: true,
      account: { select: { id: true, role: true } },
    },
  });
  if (!access) return null;
  const customerAccount = access.account?.role === 'CUSTOMER' ? access.account : null;
  return {
    id: access.id,
    emailNormalized: access.emailNormalized,
    displayName: access.displayName,
    whatsapp: access.whatsapp,
    accountId: customerAccount?.id || null,
    isRegistered: Boolean(customerAccount),
  };
}

export function setCustomerSessionCookie(
  response: NextResponse,
  customerAccessId: string,
): void {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, createCustomerSessionToken(customerAccessId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearCustomerSessionCookie(response: NextResponse): void {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function customerOwnsOrder(customerAccessId: string, orderId: string): Promise<boolean> {
  const count = await db.order.count({ where: { id: orderId, customerAccessId } });
  return count === 1;
}
