/** One state model shared by web and mobile so loading/empty/error/offline look and behave the same. */
export type ErrorKind = 'offline' | 'unavailable' | 'not_found' | 'unknown';
export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; kind: ErrorKind; message: string };

export class BackendNotConfiguredError extends Error {
  constructor() { super('The NEXUSE GO marketplace service is not connected yet.'); this.name = 'BackendNotConfiguredError'; }
}
export class NotFoundError extends Error {
  constructor(what = 'item') { super(`This ${what} could not be found.`); this.name = 'NotFoundError'; }
}

export function classifyError(e: unknown, online = true): { kind: ErrorKind; message: string } {
  if (e instanceof BackendNotConfiguredError) return { kind: 'unavailable', message: e.message };
  if (e instanceof NotFoundError) return { kind: 'not_found', message: e.message };
  if (!online || (e instanceof TypeError && /fetch|network/i.test(e.message))) {
    return { kind: 'offline', message: 'You appear to be offline. Check your connection and try again.' };
  }
  return { kind: 'unknown', message: 'Something went wrong. Please try again.' };
}

export async function load<T>(fn: () => Promise<T>, isEmpty: (d: T) => boolean = () => false, online = true): Promise<Loadable<T>> {
  try {
    const data = await fn();
    return isEmpty(data) ? { status: 'empty' } : { status: 'success', data };
  } catch (e) {
    return { status: 'error', ...classifyError(e, online) };
  }
}
