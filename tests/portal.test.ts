import { describe, it, expect, beforeEach } from 'vitest';
import { verifyOwnerPin } from '@/components/OwnerPinModal';
import { POST } from '@/app/api/portal/verify/route';
import { dataStore } from '@/lib/store';

describe('Owner Portal Authentication & Server-side Verification', () => {
  beforeEach(() => {
    dataStore.reset();
  });

  it('should validate owner access PIN correctly with helper', () => {
    const valid = verifyOwnerPin('1234', '1234');
    const invalid = verifyOwnerPin('9999', '1234');
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });

  it('should reject invalid PIN via POST /api/portal/verify without leaking analytics or PIN', async () => {
    const req = new Request('http://localhost:3000/api/portal/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'kopi-senja',
        pin: 'wrong-pin',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toMatch(/PIN salah/i);
    expect(body.venue).toBeUndefined();
    expect(body.analytics).toBeUndefined();
  });

  it('should verify correct PIN via POST /api/portal/verify and return sanitized venue, analytics, and feedback', async () => {
    const req = new Request('http://localhost:3000/api/portal/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'kopi-senja',
        pin: '1234',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.venue).toBeDefined();
    // CRITICAL: owner_access_pin must be omitted/stripped from payload!
    expect(body.venue.owner_access_pin).toBeUndefined();
    expect(body.analytics).toBeDefined();
    expect(body.feedbacks).toBeDefined();
  });

  it('should return 404 if venue is not found', async () => {
    const req = new Request('http://localhost:3000/api/portal/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'non-existent-cafe',
        pin: '1234',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});
