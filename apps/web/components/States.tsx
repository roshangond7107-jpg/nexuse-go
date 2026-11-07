'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ErrorKind } from '@nexuse/catalog';

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="state" role="status">
      <div className="em" aria-hidden="true">🗂️</div>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action && <Link className="btn" href={action.href}>{action.label}</Link>}
    </div>
  );
}

const ICON: Record<ErrorKind, string> = { offline: '📡', unavailable: '🛠️', not_found: '🔎', unknown: '⚠️' };
const TITLE: Record<ErrorKind, string> = { offline: 'You’re offline', unavailable: 'Listings aren’t live yet', not_found: 'Not found', unknown: 'Something went wrong' };

export function ErrorState({ kind, message, onRetry }: { kind: ErrorKind; message: string; onRetry?: () => void }) {
  const router = useRouter();
  const canRetry = kind === 'offline' || kind === 'unknown';
  return (
    <div className={`state ${kind === 'unavailable' ? '' : 'error'}`} role={kind === 'unavailable' ? 'status' : 'alert'}>
      <div className="em" aria-hidden="true">{ICON[kind]}</div>
      <h2>{TITLE[kind]}</h2>
      <p>{message}</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        {canRetry && <button className="btn" type="button" onClick={() => (onRetry ? onRetry() : router.refresh())}>Try again</button>}
        <Link className="btn alt" href="/">Back to home</Link>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading listings…</span>
      <ul className="grid" aria-hidden="true">{Array.from({ length: count }, (_, i) => <li key={i}><div className="skeleton" /></li>)}</ul>
    </div>
  );
}
