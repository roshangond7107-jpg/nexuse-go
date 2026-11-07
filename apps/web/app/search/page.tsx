import type { Metadata } from 'next';
import { parseSearchParams } from '@nexuse/catalog';
import { getRepository } from '@/lib/repository';
import Results from '@/components/Results';
import FilterForm from '@/components/FilterForm';

type SP = Promise<Record<string, string | string[] | undefined>>;
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const p = parseSearchParams(await searchParams);
  return { title: p.q ? `Search: ${p.q}` : 'Search' };
}

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const params = parseSearchParams(await searchParams);
  return (
    <>
      <h1>{params.q ? <>Results for “{params.q}”</> : 'Browse all listings'}</h1>
      <div className="layout">
        <aside><FilterForm params={params} action="/search" /></aside>
        <section aria-label="Search results"><Results repo={getRepository()} params={params} basePath="/search" heading="Search results" /></section>
      </div>
    </>
  );
}
