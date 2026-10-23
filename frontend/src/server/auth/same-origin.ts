import "server-only";

export function isSameOriginRequest(request: Request) {
  const requestUrl = new URL(request.url);
  const host = request.headers.get("host") ?? requestUrl.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(`${forwardedProtocol || requestUrl.protocol.slice(0, -1)}://${host}`).origin;
  } catch {
    return false;
  }
  const origin = request.headers.get("origin");

  if (origin) {
    try {
      return new URL(origin).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  return host === requestUrl.host;
}
