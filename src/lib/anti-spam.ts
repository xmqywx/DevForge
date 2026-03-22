const ipRequests = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 60_000;

export function checkHoneypot(formData: { website?: string }): boolean {
  return !!formData.website;
}

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequests.get(ip);
  if (!record || now > record.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  record.count++;
  return record.count > RATE_LIMIT;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequests) {
    if (now > record.resetAt) ipRequests.delete(ip);
  }
}, 300_000);
