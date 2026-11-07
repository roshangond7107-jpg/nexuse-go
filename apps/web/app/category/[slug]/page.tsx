import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategory, parseSearchParams } from '@nexuse/catalog';
import { getRepository } from '@/lib/repository';
import Results from '@/components/Results';
import FilterForm from '@/components/FilterForm';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getCategory((await params).slug);
  return { title: c ? c.name : 'Category' };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const slug = (await params).slug;
  const cat = getCategory(slug);
  if (!cat) notFound();
  const sp = { ...parseSearchParams(await searchParams), category: cat.slug };
  return (
    <>
      <p className="breadcrumb"><Link href="/">Home</Link> › <Link href="/categories">Categories</Link> › {cat.name}</p>
      <h1><span aria-hidden="true">{cat.emoji}</span> {cat.name}</h1>
      <p>{cat.blurb}</p>
      <div className="layout">
        <aside><FilterForm params={sp} action={`/category/${cat.slug}`} showCategory={false} /></aside>
        <section aria-label={`${cat.name} listings`}><Results repo={getRepository()} params={sp} basePath={`/category/${cat.slug}`} heading={`${cat.name} listings`} /></section>
      </div>
    </>
  );
}
