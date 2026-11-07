import { EmptyState } from '@/components/States';
export default function NotFound() { return <EmptyState title="Page not found" action={{ href: '/', label: 'Go home' }}>The page you’re looking for doesn’t exist.</EmptyState>; }
