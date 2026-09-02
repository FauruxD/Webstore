const buckets = new Map<string, number[]>();

export class CustomerAuthRateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super('Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.');
  }
}

export function assertCustomerAuthRateLimit(
  identity: string,
  options: { maxAttempts: number; windowMs: number },
  now = Date.now(),
): void {
  const cutoff = now - options.windowMs;
  const recent = (buckets.get(identity) || []).filter((timestamp) => timestamp > cutoff);
  if (recent.length >= options.maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((recent[0] + options.windowMs - now) / 1000));
    throw new CustomerAuthRateLimitError(retryAfterSeconds);
  }
  recent.push(now);
  buckets.set(identity, recent);
}

export function clearCustomerAuthRateLimit(identity: string): void {
  buckets.delete(identity);
}

export function customerAuthRateLimitKey(request: Request, scope: string, email: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || request.headers.get('x-real-ip') || 'local';
  return `${scope}:${ip}:${email}`;
}

export function resetCustomerAuthRateLimitsForTests(): void {
  buckets.clear();
}
