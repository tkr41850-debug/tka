const appBootStartedAt = typeof performance === 'undefined' ? 0 : performance.now();

export function getReadyLatencyMs(): number {
  if (typeof performance === 'undefined') {
    return 0;
  }

  return Math.max(0, Math.round(performance.now() - appBootStartedAt));
}
