'use client';
import { ErrorState } from '@/components/States';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState kind="unknown" message="Something went wrong while loading this page." onRetry={reset} />;
}
