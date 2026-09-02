import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../src/lib/db';
import {
  authenticateAccount,
  authenticateCustomerAccount,
  CustomerAccountExistsError,
  registerCustomerAccount,
} from '../../src/lib/services/customer-account';

const runDbTests = process.env.RUN_DB_TESTS === '1';
const suite = runDbTests ? describe : describe.skip;

suite('customer account lifecycle on MySQL', () => {
  const email = `qa-auth-${Date.now()}@example.test`;
  let guestAccessId = '';

  beforeAll(async () => {
    const access = await db.customerAccess.create({
      data: {
        displayName: 'QA Auth Guest',
        emailNormalized: email,
        whatsapp: '081298765432',
      },
    });
    guestAccessId = access.id;
  });

  afterAll(async () => {
    await db.account.deleteMany({ where: { emailNormalized: email } });
    await db.customerAccess.deleteMany({ where: { id: guestAccessId } });
    await db.$disconnect();
  });

  it('claims the matching current guest identity during registration', async () => {
    const registered = await registerCustomerAccount({
      displayName: 'QA Auth Customer',
      email,
      whatsapp: '081298765432',
      password: 'Atelier123',
    }, guestAccessId);

    expect(registered.customerAccessId).toBe(guestAccessId);
    expect(registered.claimedCurrentSession).toBe(true);
  });

  it('authenticates valid credentials and rejects an invalid password', async () => {
    await expect(authenticateCustomerAccount(email, 'wrong-password')).resolves.toBeNull();
    const authenticated = await authenticateCustomerAccount(email, 'Atelier123');
    expect(authenticated).toMatchObject({ customerAccessId: guestAccessId, emailNormalized: email });
  });

  it('enforces one account per normalized email', async () => {
    await expect(registerCustomerAccount({
      displayName: 'Duplicate Account',
      email,
      whatsapp: null,
      password: 'Atelier123',
    })).rejects.toBeInstanceOf(CustomerAccountExistsError);
  });

  it('resolves the existing admin through the same account authenticator', async () => {
    const admin = await authenticateAccount('admin@webstore.local', 'AdminSecret123!');
    expect(admin).toMatchObject({ role: 'SUPERADMIN', emailNormalized: 'admin@webstore.local' });
    expect(admin?.customerAccessId).toBeNull();
  });
});
