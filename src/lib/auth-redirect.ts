/** Resolve only local application paths after authentication. */
export function safeAuthRedirect(origin: string, next: string | null): URL {
  const fallback = new URL("/", origin);
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(next)) {
    return fallback;
  }
  try {
    const target = new URL(next, origin);
    return target.origin === fallback.origin ? target : fallback;
  } catch {
    return fallback;
  }
}
