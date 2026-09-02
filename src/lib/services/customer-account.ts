import bcrypt from 'bcryptjs';
import { AccountRole, Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import type { CustomerRegisterInput } from '@/lib/validation/customer-auth';

const PASSWORD_COST = 12;
const DUMMY_PASSWORD_HASH = '$2a$12$A6N9mF1b6V8Y2fQ2xYmUouX4tGxUyQ8mE7z9QwqfJj2R7C08oMxjK';

export class CustomerAccountExistsError extends Error {}

type AuthenticatedAccount =
  | {
      accountId: string;
      role: 'CUSTOMER';
      customerAccessId: string;
      adminUserId: null;
      emailNormalized: string;
      displayName: string;
    }
  | {
      accountId: string;
      role: 'ADMIN' | 'SUPERADMIN';
      customerAccessId: null;
      adminUserId: string;
      emailNormalized: string;
      displayName: string;
    };

export async function authenticateAccount(email: string, password: string): Promise<AuthenticatedAccount | null> {
  const account = await db.account.findUnique({
    where: { emailNormalized: email },
    include: { customerAccess: true, adminUser: true },
  });

  const valid = await bcrypt.compare(password, account?.passwordHash || DUMMY_PASSWORD_HASH);
  if (!account || !valid) return null;

  if (account.role === AccountRole.CUSTOMER && !account.customerAccess) return null;
  if (
    (account.role === AccountRole.ADMIN || account.role === AccountRole.SUPERADMIN)
    && (!account.adminUser || account.adminUser.status !== 'ACTIVE')
  ) return null;

  await db.account.update({
    where: { id: account.id },
    data: { lastLoginAt: new Date() },
  });

  if (account.role === AccountRole.CUSTOMER && account.customerAccess) {
    return {
      accountId: account.id,
      role: 'CUSTOMER',
      customerAccessId: account.customerAccess.id,
      adminUserId: null,
      emailNormalized: account.emailNormalized,
      displayName: account.customerAccess.displayName,
    };
  }

  if (
    (account.role === AccountRole.ADMIN || account.role === AccountRole.SUPERADMIN)
    && account.adminUser
  ) {
    return {
      accountId: account.id,
      role: account.role,
      customerAccessId: null,
      adminUserId: account.adminUser.id,
      emailNormalized: account.emailNormalized,
      displayName: account.adminUser.name,
    };
  }

  return null;
}

/** @deprecated Use authenticateAccount so the account role controls the destination. */
export async function authenticateCustomerAccount(email: string, password: string) {
  const account = await authenticateAccount(email, password);
  return account?.role === AccountRole.CUSTOMER ? account : null;
}

export async function registerCustomerAccount(
  input: CustomerRegisterInput,
  currentCustomerAccessId?: string,
) {
  const passwordHash = await bcrypt.hash(input.password, PASSWORD_COST);

  try {
    return await db.$transaction(async (tx) => {
      const existingAccount = await tx.account.findUnique({
        where: { emailNormalized: input.email },
        select: { id: true },
      });
      if (existingAccount) throw new CustomerAccountExistsError('Email sudah memiliki akun.');

      let customerAccess = currentCustomerAccessId
        ? await tx.customerAccess.findUnique({
            where: { id: currentCustomerAccessId },
            include: { account: { select: { id: true } } },
          })
        : null;

      const canClaimCurrentSession = Boolean(
        customerAccess
        && !customerAccess.account
        && customerAccess.emailNormalized === input.email,
      );

      if (canClaimCurrentSession && customerAccess) {
        customerAccess = await tx.customerAccess.update({
          where: { id: customerAccess.id },
          data: {
            displayName: input.displayName,
            whatsapp: input.whatsapp,
          },
          include: { account: { select: { id: true } } },
        });
      } else {
        customerAccess = await tx.customerAccess.create({
          data: {
            displayName: input.displayName,
            emailNormalized: input.email,
            whatsapp: input.whatsapp,
          },
          include: { account: { select: { id: true } } },
        });
      }

      const account = await tx.account.create({
        data: {
          emailNormalized: input.email,
          passwordHash,
          role: AccountRole.CUSTOMER,
          customerAccessId: customerAccess.id,
          lastLoginAt: new Date(),
        },
      });

      return {
        accountId: account.id,
        customerAccessId: customerAccess.id,
        emailNormalized: account.emailNormalized,
        displayName: customerAccess.displayName,
        claimedCurrentSession: canClaimCurrentSession,
      };
    });
  } catch (cause: unknown) {
    if (
      cause instanceof CustomerAccountExistsError
      || (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2002')
    ) {
      throw new CustomerAccountExistsError('Email sudah memiliki akun.');
    }
    throw cause;
  }
}
