import { vi, type Mock } from 'vitest';

// The scripts under test only read `ok`, `status`, and `json` off whatever
// `fetchImpl` resolves to; they never touch headers, redirected, statusText,
// or the rest of the real Response interface. Building that full interface
// for every test case would be noise, so the minimal shape is cast to
// Response once, here, instead of being cast at each call site.

/**
 * Builds a Response-shaped object for a successful fetch call.
 */
export function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: true,
    status,
    json: async () => body,
  } as Response;
}

/**
 * Builds a Response-shaped object for a failed fetch call.
 */
export function failedResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
  } as Response;
}

/**
 * Wraps an implementation in a `vi.fn` typed as the global `fetch`, so it can
 * be passed straight through as `fetchImpl` without a cast at the call site,
 * and `.mock.calls[n]` keeps the real `[input, init]` tuple shape.
 */
export function createFetchMock(
  impl: (...args: Parameters<typeof fetch>) => Promise<Response>,
): Mock<typeof fetch> {
  return vi.fn(impl);
}
